use axum::{
    extract::{Path, State},
    Json,
};
use crate::state::AppState;
use std::sync::Arc;
use crate::models::*; // Import if needed
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use crate::middleware::auth::AuthUser;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct WaterLog {
    pub id: i64,
    pub date: String,
    pub amount_ml: i64,
}

#[derive(Deserialize, ToSchema)]
pub struct LogWaterRequest {
    pub date: String,
    pub amount_ml: i64,
}

#[utoipa::path(
    get,
    path = "/water/daily/{date}",
    params(
        ("date" = String, Path, description = "Date YYYY-MM-DD")
    ),
    responses(
        (status = 200, description = "Get daily water intake", body = serde_json::Value)
    )
)]
pub async fn get_daily_water(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Path(date): Path<String>,
) -> Json<serde_json::Value> {
    let logs = sqlx::query_as!(
        WaterLog,
        r#"SELECT id, cast(date as text) as date, amount_ml as "amount_ml!" FROM water_logs WHERE user_id = $1 AND date = $2"#,
        auth_user.user_id,
        date
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or(vec![]);

    let total_ml: i64 = logs.iter().map(|l| l.amount_ml).sum();
    
    Json(serde_json::json!({
        "date": date,
        "total_ml": total_ml,
        "logs": logs
    }))
}

#[utoipa::path(
    post,
    path = "/water/log",
    request_body = LogWaterRequest,
    responses(
        (status = 200, description = "Log water intake", body = serde_json::Value)
    )
)]
pub async fn log_water(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Json(payload): Json<LogWaterRequest>,
) -> Json<serde_json::Value> {
    let result = sqlx::query!(
        "INSERT INTO water_logs (user_id, date, amount_ml) VALUES ($1, $2, $3)",
        auth_user.user_id,
        payload.date,
        payload.amount_ml
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => Json(serde_json::json!({ "status": "success", "message": "Water logged" })),
        Err(e) => Json(serde_json::json!({ "status": "error", "message": e.to_string() })),
    }
}
