use std::sync::Arc;
use axum::{extract::{State, Multipart}, Json};
use crate::state::AppState;
use crate::models::{NewWeightLog, WeightLog};
use std::fs;
use crate::middleware::auth::AuthUser;

#[utoipa::path(
    post,
    path = "/weight-logs",
    request_body(content = NewWeightLog, content_type = "multipart/form-data"),
    responses(
        (status = 200, description = "Add weight log", body = serde_json::Value)
    )
)]
pub async fn add_weight_log(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    mut multipart: Multipart,
) -> Json<serde_json::Value> {
    let mut weight = 0.0;
    let mut note = None;
    let mut photo_url = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();

        if name == "weight" {
            if let Ok(val) = field.text().await {
                weight = val.parse().unwrap_or(0.0);
            }
        } else if name == "note" {
            if let Ok(val) = field.text().await {
                if !val.trim().is_empty() {
                    note = Some(val);
                }
            }
        } else if name == "photo" {
            if let Ok(data) = field.bytes().await {
                if !data.is_empty() {
                    let file_name = format!("{}.jpg", uuid::Uuid::new_v4());
                    let path = std::path::Path::new("uploads").join(&file_name);
                    if let Ok(_) = fs::write(&path, data) {
                        photo_url = Some(format!("/uploads/{}", file_name));
                    }
                }
            }
        }
    }

    // --- GAMIFICATION LOGIC ---
    
    // 1. Get Current User State
    let user = sqlx::query!(
        r#"SELECT level as "level?", aura as "aura?", current_weight as "current_weight!" FROM users WHERE id = $1"#,
        auth_user.user_id
    )
    .fetch_optional(&state.pool)
    .await
    .unwrap_or(None);

    let (mut current_level, mut current_aura, last_weight) = match user {
        Some(u) => (u.level.unwrap_or(1), u.aura.unwrap_or(0), u.current_weight),
        None => (1, 0, 0.0),
    };

    // 2. Calculate XP Gained
    let mut xp_gained = 50; // Base XP for showing up
    let mut bonuses: Vec<String> = Vec::new();

    bonuses.push("Log Entry: +50 XP".to_string());

    if note.is_some() {
        xp_gained += 20;
        bonuses.push("Journaling: +20 XP".to_string());
    }

    if photo_url.is_some() {
        xp_gained += 50;
        bonuses.push("Progress Photo: +50 XP".to_string());
    }

    // Goal Progress Bonus (Gain or Loss)
    let user_profile = sqlx::query!(
        r#"SELECT start_weight as "start_weight!", target_weight as "target_weight!" FROM users WHERE id = $1"#,
        auth_user.user_id
    )
    .fetch_optional(&state.pool)
    .await
    .unwrap_or(None);

    if let Some(profile) = user_profile {
        if last_weight > 0.0 {
            let is_gain_goal = profile.target_weight > profile.start_weight;
            
            // Check if we moved closure to goal compared to last weight
            let moved_closer = if is_gain_goal {
                weight > last_weight
            } else {
                weight < last_weight
            };

            if moved_closer {
                let diff = (last_weight - weight).abs();
                if diff > 0.0 {
                    let bonus = (diff * 100.0) as i64; // 100 XP per kg change
                    let safe_bonus = bonus.clamp(10, 500);
                    xp_gained += safe_bonus;
                    bonuses.push(format!("Goal Progress: +{} XP", safe_bonus));
                }
            }
        }
    }

    // 3. Apply XP & Check Logic
    current_aura += xp_gained;
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

    // 4. Database Updates
    
    // Insert Log
    let log_result = sqlx::query!(
        r#"
        INSERT INTO weight_logs (user_id, weight, note, photo_url)
        VALUES ($1, $2, $3, $4)
        "#,
        auth_user.user_id,
        weight,
        note,
        photo_url
    )
    .execute(&state.pool)
    .await;

    if let Err(e) = log_result {
        return Json(serde_json::json!({ "status": "error", "message": e.to_string() }));
    }

    // Update User Profile (Weight + XP + Level)
    let _ = sqlx::query!(
        r#"
        UPDATE users 
        SET current_weight = $1, 
        level = $2, 
        aura = $3, 
        updated_at = CURRENT_TIMESTAMP 
        WHERE id = $4
        "#,
        weight,
        current_level,
        current_aura,
        auth_user.user_id
    )
    .execute(&state.pool)
    .await;

    Json(serde_json::json!({ 
        "status": "success", 
        "message": "Weight logged",
        "xpGained": xp_gained,
        "bonuses": bonuses,
        "leveledUp": leveled_up,
        "newLevel": current_level,
        "newAura": current_aura,
        "xpToNext": current_level * 1000
    }))
}

#[utoipa::path(
    get,
    path = "/weight-logs",
    responses(
        (status = 200, description = "Get weight history", body = Vec<WeightLog>)
    )
)]
pub async fn get_weight_history(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
) -> Json<serde_json::Value> {
    let logs = sqlx::query_as!(
        WeightLog,
        r#"
        SELECT id, user_id, weight, date, note, photo_url
        FROM weight_logs
        WHERE user_id = $1
        ORDER BY date DESC
        "#,
        auth_user.user_id
    )
    .fetch_all(&state.pool)
    .await;

    match logs {
        Ok(data) => Json(serde_json::to_value(data).unwrap()),
        Err(e) => Json(serde_json::json!({ "error": e.to_string() })),
    }
}
