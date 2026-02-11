use std::sync::Arc;
use axum::{
    extract::{Path, Query, State},
    Json,
};
use crate::state::AppState;
use crate::models::*; // Import all models
use serde::Deserialize;
use utoipa::ToSchema;
use crate::middleware::auth::AuthUser;

#[derive(Deserialize)]
pub struct SearchQuery {
    q: String,
}

#[utoipa::path(
    get,
    path = "/food-items",
    params(
        ("q" = String, Query, description = "Search query for food items")
    ),
    responses(
        (status = 200, description = "Search food items", body = Vec<FoodItem>)
    )
)]
pub async fn search_food_items(
    State(state): State<Arc<AppState>>,
    // auth_user: AuthUser, // Searching doesn't strictly require auth if public database, but let's enforce it for consistency or leave public?
    // Let's leave public for now unless user wants strict auth everywhere. User said "proper authentication".
    // I'll add auth to be safe.
    _auth_user: AuthUser, 
    Query(query): Query<SearchQuery>,
) -> Json<serde_json::Value> {
    let search_term = format!("%{}%", query.q);
    let foods = sqlx::query_as!(
        FoodItem,
        r#"
        SELECT 
            id, 
            name, 
            calories as "calories!", 
            protein as "protein!", 
            carbs as "carbs!", 
            fat as "fat!", 
            serving_unit as "serving_unit!", 
            serving_size as "serving_size!", 
            created_at
        FROM food_items
        WHERE name LIKE $1
        ORDER BY name ASC
        LIMIT 20
        "#,
        search_term
    )
    .fetch_all(&state.pool)
    .await;

    match foods {
        Ok(data) => Json(serde_json::to_value(data).unwrap()),
        Err(e) => Json(serde_json::json!({ "error": e.to_string() })),
    }
}

#[utoipa::path(
    get,
    path = "/food-items/{id}",
    params(
        ("id" = i64, Path, description = "Food Item ID")
    ),
    responses(
        (status = 200, description = "Get food item details", body = FoodItem)
    )
)]
pub async fn get_food_item(
    State(state): State<Arc<AppState>>,
    _auth_user: AuthUser,
    Path(id): Path<i64>,
) -> Json<serde_json::Value> {
    let food = sqlx::query_as!(
        FoodItem,
        r#"
        SELECT 
            id, 
            name, 
            calories as "calories!", 
            protein as "protein!", 
            carbs as "carbs!", 
            fat as "fat!", 
            serving_unit as "serving_unit!", 
            serving_size as "serving_size!", 
            created_at
        FROM food_items
        WHERE id = $1
        "#,
        id
    )
    .fetch_optional(&state.pool)
    .await;

    match food {
        Ok(Some(item)) => Json(serde_json::to_value(item).unwrap()),
        Ok(None) => Json(serde_json::json!({ "error": "Food not found" })),
        Err(e) => Json(serde_json::json!({ "error": e.to_string() })),
    }
}
#[utoipa::path(
    post,
    path = "/food-items",
    request_body = CreateFoodItemRequest,
    responses(
        (status = 200, description = "Create food item", body = serde_json::Value)
    )
)]
pub async fn create_food_item(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Json(payload): Json<CreateFoodItemRequest>,
) -> Json<serde_json::Value> {
    let result = sqlx::query!(
        r#"
        INSERT INTO food_items (name, calories, protein, carbs, fat, serving_unit, serving_size, created_by_user_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        "#,
        payload.name,
        payload.calories,
        payload.protein,
        payload.carbs,
        payload.fat,
        payload.serving_unit,        
        payload.serving_size,
        auth_user.user_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => Json(serde_json::json!({ "status": "success", "message": "Food created" })),
        Err(e) => Json(serde_json::json!({ "status": "error", "message": e.to_string() })),
    }
}

#[utoipa::path(
    get,
    path = "/nutrition/daily/{date}",
    params(
        ("date" = String, Path, description = "Date in YYYY-MM-DD format")
    ),
    responses(
        (status = 200, description = "Get daily nutrition stats", body = DailyNutritionStats)
    )
)]
pub async fn get_daily_nutrition(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Path(date): Path<String>,
) -> Json<serde_json::Value> {
    let logs = sqlx::query_as!(
        MealLog,
        r#"
        SELECT 
            id, 
            cast(date as text) as date, 
            meal_type, 
            food_item_id,
            food_name, 
            calories as "calories!", 
            protein as "protein!", 
            carbs as "carbs!", 
            fat as "fat!", 
            servings as "servings!"
        FROM meal_logs
        WHERE user_id = $1 AND date = $2
        "#,
        auth_user.user_id,
        date
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or(vec![]);

    let mut total_calories = 0;
    let mut total_protein = 0.0;
    let mut total_carbs = 0.0;
    let mut total_fat = 0.0;

    for log in &logs {
        total_calories += log.calories;
        total_protein += log.protein;
        total_carbs += log.carbs;
        total_fat += log.fat;
    }

    // Fetch User Profile for TDEE Calculation
    let profile = sqlx::query_as!(
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
    .fetch_one(&state.pool)
    .await
    .unwrap(); 

    // BMR Calculation (Mifflin-St Jeor)
    let s = if profile.gender.to_lowercase() == "male" { 5.0 } else { -161.0 };
    let bmr = (10.0 * profile.current_weight) + (6.25 * profile.height) - (5.0 * profile.age as f64) + s;
    
    // TDEE (Sedentary 1.2 default, could be stored in profile)
    let tdee = bmr * 1.2;

    // Goal Adjustment
    let goal_calories: f64 = if profile.target_weight < profile.current_weight {
        // Cutting: Deficit of 500 (approx 0.5kg/week loss)
        let deficit_cals = tdee - 500.0;
        if deficit_cals < 1200.0 { 1200.0 } else { deficit_cals }
    } else if profile.target_weight > profile.current_weight {
        // Bulking: Surplus of 300 
        tdee + 300.0
    } else {
        // Maintenance
        tdee
    };

    // Macro Split (High Protein)
    // Protein: 2.0g per kg of bodyweight
    let goal_protein = profile.current_weight * 2.0; 
    // Fat: 0.8g per kg
    let goal_fat = profile.current_weight * 0.8;
    // Carbs: Remainder
    let protein_cals = goal_protein * 4.0;
    let fat_cals = goal_fat * 9.0;
    let remainder_cals = goal_calories - protein_cals - fat_cals;
    let carbs_from_cals = remainder_cals / 4.0;
    let goal_carbs = if carbs_from_cals < 50.0 { 50.0 } else { carbs_from_cals }; 

    let goals = NutritionGoals {
        calories: goal_calories.round() as i64,
        protein: goal_protein.round(),
        carbs: goal_carbs.round(),
        fat: goal_fat.round(),
    };

    let stats = DailyNutritionStats {
        date,
        total_calories,
        total_protein,
        total_carbs,
        total_fat,
        goals,
        logs,
    };

    Json(serde_json::to_value(stats).unwrap())
}

#[utoipa::path(
    post,
    path = "/nutrition/log",
    request_body = LogMealRequest,
    responses(
        (status = 200, description = "Log a meal", body = serde_json::Value)
    )
)]
pub async fn log_meal(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Json(payload): Json<LogMealRequest>,
) -> Json<serde_json::Value> {
    
    let result = sqlx::query!(
        r#"
        INSERT INTO meal_logs (user_id, date, meal_type, food_item_id, food_name, calories, protein, carbs, fat, servings)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        "#,
        auth_user.user_id,
        payload.date,
        payload.meal_type,
        payload.food_item_id,
        payload.food_name,
        payload.calories,
        payload.protein,
        payload.carbs,
        payload.fat,
        payload.servings
    )
    .execute(&state.pool)
    .await;

    // --- GAMIFICATION: Award XP for logging a meal ---
    let _ = sqlx::query!("UPDATE users SET aura = aura + 10 WHERE id = $1", auth_user.user_id)
        .execute(&state.pool).await;

    match result {
        Ok(_) => Json(serde_json::json!({ "status": "success", "message": "Meal logged", "xpGained": 10 })),
        Err(e) => Json(serde_json::json!({ "status": "error", "message": e.to_string() })),
    }
}

#[utoipa::path(
    delete,
    path = "/nutrition/log/{id}",
    params(
        ("id" = i64, Path, description = "Meal Log ID to delete")
    ),
    responses(
        (status = 200, description = "Delete a meal log", body = serde_json::Value)
    )
)]
pub async fn delete_meal_log(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Path(id): Path<i64>,
) -> Json<serde_json::Value> {
    let result = sqlx::query!(
        "DELETE FROM meal_logs WHERE id = $1 AND user_id = $2",
        id,
        auth_user.user_id
    )
    .execute(&state.pool)
    .await;

    // Revert XP
    let _ = sqlx::query!("UPDATE users SET aura = MAX(0, aura - 10) WHERE id = $1", auth_user.user_id)
        .execute(&state.pool).await;

    match result {
        Ok(_) => Json(serde_json::json!({ "status": "success", "message": "Meal log deleted" })),
        Err(e) => Json(serde_json::json!({ "status": "error", "message": e.to_string() })),
    }
}

#[utoipa::path(
    put,
    path = "/nutrition/log/{id}",
    params(
        ("id" = i64, Path, description = "Meal Log ID to update")
    ),
    request_body = LogMealRequest,
    responses(
        (status = 200, description = "Update a meal log", body = serde_json::Value)
    )
)]
pub async fn update_meal_log(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Path(id): Path<i64>,
    Json(payload): Json<LogMealRequest>,
) -> Json<serde_json::Value> {
    let result = sqlx::query!(
        r#"
        UPDATE meal_logs 
        SET date = $1, meal_type = $2, food_item_id = $3, food_name = $4, calories = $5, protein = $6, carbs = $7, fat = $8, servings = $9
        WHERE id = $10 AND user_id = $11
        "#,
        payload.date,
        payload.meal_type,
        payload.food_item_id,
        payload.food_name,
        payload.calories,
        payload.protein,
        payload.carbs,
        payload.fat,
        payload.servings,
        id,
        auth_user.user_id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => Json(serde_json::json!({ "status": "success", "message": "Meal log updated" })),
        Err(e) => Json(serde_json::json!({ "status": "error", "message": e.to_string() })),
    }
}

#[utoipa::path(
    post,
    path = "/food-items/favorites/{id}",
    params(
        ("id" = i64, Path, description = "Food Item ID")
    ),
    responses(
        (status = 200, description = "Add favorite", body = serde_json::Value)
    )
)]
pub async fn add_favorite(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Path(id): Path<i64>,
) -> Json<serde_json::Value> {
    let result = sqlx::query!(
        "INSERT INTO favorite_foods (user_id, food_item_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        auth_user.user_id,
        id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => Json(serde_json::json!({ "status": "success", "message": "Added to favorites" })),
        Err(e) => Json(serde_json::json!({ "status": "error", "message": e.to_string() })),
    }
}

#[utoipa::path(
    delete,
    path = "/food-items/favorites/{id}",
    params(
        ("id" = i64, Path, description = "Food Item ID")
    ),
    responses(
        (status = 200, description = "Remove favorite", body = serde_json::Value)
    )
)]
pub async fn remove_favorite(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Path(id): Path<i64>,
) -> Json<serde_json::Value> {
    let result = sqlx::query!(
        "DELETE FROM favorite_foods WHERE user_id = $1 AND food_item_id = $2",
        auth_user.user_id,
        id
    )
    .execute(&state.pool)
    .await;

    match result {
        Ok(_) => Json(serde_json::json!({ "status": "success", "message": "Removed from favorites" })),
        Err(e) => Json(serde_json::json!({ "status": "error", "message": e.to_string() })),
    }
}

#[utoipa::path(
    get,
    path = "/food-items/favorites",
    responses(
        (status = 200, description = "Get favorite foods", body = Vec<FoodItem>)
    )
)]
pub async fn get_favorites(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
) -> Json<serde_json::Value> {
    let foods = sqlx::query_as!(
        FoodItem,
        r#"
        SELECT 
            f.id, 
            f.name, 
            f.calories as "calories!", 
            f.protein as "protein!", 
            f.carbs as "carbs!", 
            f.fat as "fat!", 
            f.serving_unit as "serving_unit!", 
            f.serving_size as "serving_size!", 
            f.created_at
        FROM food_items f
        JOIN favorite_foods fav ON f.id = fav.food_item_id
        WHERE fav.user_id = $1
        ORDER BY f.name ASC
        "#,
        auth_user.user_id
    )
    .fetch_all(&state.pool)
    .await;

    match foods {
        Ok(data) => Json(serde_json::to_value(data).unwrap()),
        Err(e) => Json(serde_json::json!({ "error": e.to_string() })),
    }
}

#[derive(Deserialize, ToSchema)] // Ensure ToSchema is derived if using Utoipa (might need to add it to derive)
pub struct CopyMealsRequest {
    pub from_date: String,
    pub to_date: String,
    pub meal_type: Option<String>,
}

#[utoipa::path(
    post,
    path = "/nutrition/copy",
    request_body = CopyMealsRequest,
    responses(
        (status = 200, description = "Copy meals from one date to another", body = serde_json::Value)
    )
)]
pub async fn copy_meals(
    State(state): State<Arc<AppState>>,
    auth_user: AuthUser,
    Json(payload): Json<CopyMealsRequest>,
) -> Json<serde_json::Value> {
    
    // We need to handle the query logic manually since we can't easily conditionally query inside sqlx macro with nullable params in this specific way without complex dynamic SQL
    // But since meal_type is String, we can just use two branches.

    let logs = if let Some(mt) = &payload.meal_type {
        sqlx::query_as!(
            MealLog,
            r#"
            SELECT 
                id, 
                cast(date as text) as date, 
                meal_type, 
                food_item_id, 
                food_name, 
                calories as "calories!", 
                protein as "protein!", 
                carbs as "carbs!", 
                fat as "fat!", 
                servings as "servings!"
            FROM meal_logs 
            WHERE user_id = $1 AND date = $2 AND meal_type = $3
            "#,
            auth_user.user_id,
            payload.from_date,
            mt
        )
        .fetch_all(&state.pool)
        .await
    } else {
        sqlx::query_as!(
            MealLog,
            r#"
            SELECT 
                id, 
                cast(date as text) as date, 
                meal_type, 
                food_item_id, 
                food_name, 
                calories as "calories!", 
                protein as "protein!", 
                carbs as "carbs!", 
                fat as "fat!", 
                servings as "servings!"
            FROM meal_logs 
            WHERE user_id = $1 AND date = $2
            "#,
            auth_user.user_id,
            payload.from_date
        )
        .fetch_all(&state.pool)
        .await
    };

    let logs = match logs {
        Ok(l) => l,
        Err(e) => return Json(serde_json::json!({ "status": "error", "message": e.to_string() })),
    };

    if logs.is_empty() {
        return Json(serde_json::json!({ "status": "success", "message": "No meals to copy" }));
    }

    let mut success_count = 0;
    for log in logs {
        let result = sqlx::query!(
            r#"
            INSERT INTO meal_logs (user_id, date, meal_type, food_item_id, food_name, calories, protein, carbs, fat, servings)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            "#,
            auth_user.user_id,
            payload.to_date,
            log.meal_type,
            log.food_item_id,
            log.food_name,
            log.calories,
            log.protein,
            log.carbs,
            log.fat,
            log.servings
        )
        .execute(&state.pool)
        .await;

        if result.is_ok() {
            success_count += 1;
        }
    }

    Json(serde_json::json!({ "status": "success", "message": format!("Copied {} meals", success_count) }))
}
