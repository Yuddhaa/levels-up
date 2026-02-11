use axum::{
    routing::{get, post, delete, put},
    Router,
};
use std::net::SocketAddr;
use tower_http::{cors::CorsLayer, services::ServeDir};
use std::fs;
use sqlx::SqlitePool;
use std::sync::Arc;
use dotenvy::dotenv;
use std::env;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

mod state;
mod models;
mod handlers;
mod api_docs;
mod middleware;

use state::AppState;
use api_docs::ApiDoc;
use handlers::*;

#[tokio::main]
async fn main() {
    dotenv().ok();
    
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = SqlitePool::connect(&database_url).await.expect("Failed to connect to DB");
    
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    println!("✅ Database connected and migrations run.");

    // Create uploads directory
    fs::create_dir_all("uploads").expect("Failed to create uploads directory");

    let state = Arc::new(AppState { pool });

    let app = Router::new()
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/calculate-fitness", post(calculate_fitness))
        .route("/profile", post(save_profile))
        .route("/dashboard-stats", get(get_dashboard_stats))
        .route("/weight-logs", post(add_weight_log))
        .route("/weight-logs", get(get_weight_history))
        .route("/award-xp", post(award_xp))
        .route("/food-items", get(search_food_items))
        .route("/food-items/favorites", get(get_favorites))
        .route("/food-items/favorites/:id", post(add_favorite).delete(remove_favorite))
        .route("/food-items/:id", get(get_food_item))
        .route("/food-items/create", post(create_food_item))
        .route("/nutrition/copy", post(copy_meals))
        .route("/nutrition/daily/:date", get(get_daily_nutrition))
        .route("/nutrition/log", post(log_meal))
        .route("/nutrition/log/:id", delete(delete_meal_log).put(update_meal_log))
        .route("/water/daily/:date", get(get_daily_water))
        .route("/water/log", post(log_water))
        .nest_service("/uploads", ServeDir::new("uploads"))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("🚀 Server listening on http://{}", addr);
    println!("📄 Swagger UI available at http://{}/swagger-ui", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
