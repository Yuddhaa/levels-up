use std::sync::Arc;
use axum::{extract::State, Json};
use crate::state::AppState;
use crate::models::XPRequest;
use crate::middleware::auth::AuthUser;

#[utoipa::path(
    post,
    path = "/award-xp",
    request_body = XPRequest,
    responses(
        (status = 200, description = "Award XP", body = serde_json::Value)
    )
)]
pub async fn award_xp(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Json(payload): Json<XPRequest>
) -> Json<serde_json::Value> {
     // 1. Get Current User State
    let user = sqlx::query!(
        "SELECT level, aura FROM users WHERE id = $1",
        auth_user.user_id
    )
    .fetch_optional(&state.pool)
    .await
    .unwrap_or(None);

    let (mut current_level, mut current_aura) = match user {
        Some(u) => (u.level.unwrap_or(1), u.aura.unwrap_or(0)),
        None => (1, 0),
    };

    // 2. Add XP
    current_aura += payload.amount as i64;
    let mut leveled_up = false;
    
    // Level Curve
    loop {
        let xp_needed = current_level * 1000;
        if current_aura >= xp_needed {
            current_aura -= xp_needed;
            current_level += 1;
            leveled_up = true;
        } else {
            break;
        }
    }

    // 3. Update DB
    let _ = sqlx::query!(
        r#"
        UPDATE users 
        SET level = $1, aura = $2, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $3
        "#,
        current_level,
        current_aura,
        auth_user.user_id
    )
    .execute(&state.pool)
    .await;

    Json(serde_json::json!({ 
        "status": "success", 
        "xpGained": payload.amount,
        "bonuses": vec![payload.reason],
        "leveledUp": leveled_up,
        "newLevel": current_level,
        "newAura": current_aura
    }))
}
