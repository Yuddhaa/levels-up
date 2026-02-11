use axum::Json;

#[utoipa::path(
    get,
    path = "/",
    responses(
        (status = 200, description = "Welcome message", body = serde_json::Value)
    )
)]
pub async fn root() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "message": "Hello from Rust Server! 🦀" }))
}

#[utoipa::path(
    get,
    path = "/health",
    responses(
        (status = 200, description = "Health check", body = serde_json::Value)
    )
)]
pub async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "healthy", "uptime": "forever" }))
}
