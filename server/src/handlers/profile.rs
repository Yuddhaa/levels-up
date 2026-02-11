use std::sync::Arc;
use axum::{extract::State, Json};
use crate::state::AppState;
use crate::models::{UserProfile, DashboardStats};

use crate::middleware::auth::AuthUser;

#[utoipa::path(
    post,
    path = "/profile",
    request_body = UserProfile,
    responses(
        (status = 200, description = "Save user profile", body = serde_json::Value)
    )
)]
pub async fn save_profile(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Json(profile): Json<UserProfile>
) -> Json<serde_json::Value> {
    let result = sqlx::query!(
        r#"
        UPDATE users SET
            name = $1,
            current_weight = $2,
            start_weight = $3,
            target_weight = $4,
            height = $5,
            age = $6,
            gender = $7,
            level = $8,
            aura = $9,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        "#,
        profile.name,
        profile.current_weight,
        profile.start_weight,
        profile.target_weight,
        profile.height,
        profile.age,
        profile.gender,
        profile.level,
        profile.aura,
        auth_user.user_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => Json(serde_json::json!({ "status": "saved", "profile": profile })),
        Err(e) => {
            eprintln!("DB Error: {}", e);
            Json(serde_json::json!({ "status": "error", "message": e.to_string() }))
        }
    }
}

#[utoipa::path(
    get,
    path = "/dashboard-stats",
    responses(
        (status = 200, description = "Get dashboard stats", body = DashboardStats)
    )
)]
pub async fn get_dashboard_stats(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
) -> Json<serde_json::Value> {
    let profile_result = sqlx::query_as!(
        UserProfile,
        r#"
        SELECT 
            id as "id!", 
            name as "name!", 
            current_weight as "current_weight!", 
            start_weight as "start_weight!", 
            target_weight as "target_weight!", 
            height as "height!", 
            age as "age!", 
            gender as "gender!", 
            level as "level?", 
            aura as "aura?"
        FROM users WHERE id = $1
        "#,
        auth_user.user_id
    )
    .fetch_optional(&state.pool)
    .await;

    let profile = match profile_result {
        Ok(Some(p)) => p,
        Ok(None) => return Json(serde_json::json!({ "error": "No profile found" })),
        Err(e) => return Json(serde_json::json!({ "error": e.to_string() })),
    };

    // Calculations
    let height_m = profile.height / 100.0;
    let bmi = profile.current_weight / (height_m * height_m);
    
    let bmi_category = if bmi < 18.5 { "Underweight" }
    else if bmi < 25.0 { "Normal Weight" }
    else if bmi < 30.0 { "Overweight" }
    else { "Obese" };

    let base_bmr = (10.0 * profile.current_weight) + (6.25 * profile.height) - (5.0 * profile.age as f64);
    let bmr: f64 = if profile.gender.to_lowercase() == "male" { base_bmr + 5.0 } else { base_bmr - 161.0 };
    let tdee: f64 = bmr * 1.2;

    let total_change = (profile.current_weight - profile.start_weight).abs();
    let total_goal_diff = (profile.target_weight - profile.start_weight).abs();
    
    // Determine if goal is met or exceeded
    let is_gain_goal = profile.target_weight > profile.start_weight;
    let goal_met = if is_gain_goal {
        profile.current_weight >= profile.target_weight
    } else {
        profile.current_weight <= profile.target_weight
    };

    let goal_progress = if total_goal_diff == 0.0 {
        100.0
    } else if goal_met {
        100.0
    } else {
        // Progress is relative to the start -> target path
        // For loss: start - current / start - target
        // For gain: current - start / target - start
        // Both simplify to: abs(current - start) / abs(target - start) 
        // *if current is in the right direction*
        
        let progress_dir = if is_gain_goal {
            profile.current_weight - profile.start_weight
        } else {
            profile.start_weight - profile.current_weight
        };

        if progress_dir < 0.0 {
            0.0
        } else {
            (progress_dir / total_goal_diff) * 100.0
        }
    };
    
    let level = profile.level.unwrap_or(1);
    let aura = profile.aura.unwrap_or(0);
    let xp_to_next_level = level * 1000;
    let xp_progress = (aura as f64 / xp_to_next_level as f64) * 100.0;

    let stats = DashboardStats {
        profile: profile.clone(),
        bmi: (bmi * 10.0).round() / 10.0,
        bmi_category: bmi_category.to_string(),
        bmr: bmr.round(),
        tdee: tdee.round(),
        total_lost: (total_change * 10.0).round() / 10.0, // This is now total change (abs)
        goal_progress: goal_progress.clamp(0.0, 100.0),
        xp_to_next_level: xp_to_next_level as u32,
        xp_progress: xp_progress.clamp(0.0, 100.0),
    };

    Json(serde_json::to_value(stats).unwrap())
}
