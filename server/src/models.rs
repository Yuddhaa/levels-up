use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;

// ... existing models ...
// ... existing models ...

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
    pub name: String,
    pub current_weight: f64,
    pub target_weight: f64,
    pub height: f64,
    pub age: i64,
    pub gender: String,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AuthResponse {
    pub token: String,
    pub user: UserProfile,
}
#[derive(Serialize, Deserialize, Clone, Debug, FromRow, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub id: Option<i64>, 
    pub name: String,
    pub current_weight: f64,
    pub start_weight: f64,
    pub target_weight: f64,
    pub height: f64,
    pub age: i64,
    pub gender: String,
    pub level: Option<i64>,
    pub aura: Option<i64>,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct DashboardStats {
    pub profile: UserProfile,
    pub bmi: f64,
    pub bmi_category: String,
    pub bmr: f64,
    pub tdee: f64,
    pub total_lost: f64,
    pub goal_progress: f64,
    pub xp_to_next_level: u32,
    pub xp_progress: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct WeightLog {
    pub id: i64,
    pub user_id: i64,
    pub weight: f64,
    pub date: Option<chrono::NaiveDateTime>,
    pub note: Option<String>,
    pub photo_url: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct NewWeightLog {
    pub weight: f64,
    pub note: Option<String>,
    #[schema(value_type = String, format = "binary")]
    pub photo: Option<String>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct XPRequest {
    pub amount: u32,
    pub reason: String,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct FitnessRequest {
    pub weight: f64, pub height: f64, pub age: u32, pub gender: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct FitnessResponse {
    pub bmi: f64, pub bmi_category: String, pub bmr: f64, pub tdee_sedentary: f64,
}

// --- Nutrition Models ---

#[derive(Serialize, Deserialize, Clone, Debug, FromRow, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct FoodItem {
    pub id: i64,
    pub name: String,
    pub calories: i64,
    pub protein: f64,
    pub carbs: f64,
    pub fat: f64,
    pub serving_unit: String,
    pub serving_size: f64,
    pub created_at: Option<chrono::NaiveDateTime>,
}

#[derive(Serialize, Deserialize, Clone, Debug, FromRow, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct MealLog {
    pub id: i64,
    pub date: String, // Stored as YYYY-MM-DD
    pub meal_type: String,
    pub food_item_id: Option<i64>,
    pub food_name: String,
    pub calories: i64,
    pub protein: f64,
    pub carbs: f64,
    pub fat: f64,
    pub servings: f64,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateFoodItemRequest {
    pub name: String,
    pub calories: i64,
    pub protein: f64,
    pub carbs: f64,
    pub fat: f64,
    pub serving_unit: String,
    pub serving_size: f64,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct LogMealRequest {
    pub date: String,
    pub meal_type: String,
    pub food_item_id: Option<i64>,
    pub food_name: String,
    pub calories: i64,
    pub protein: f64,
    pub carbs: f64,
    pub fat: f64,
    pub servings: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct NutritionGoals {
    pub calories: i64,
    pub protein: f64,
    pub carbs: f64,
    pub fat: f64,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct DailyNutritionStats {
    pub date: String,
    pub total_calories: i64,
    pub total_protein: f64,
    pub total_carbs: f64,
    pub total_fat: f64,
    pub goals: NutritionGoals, // Added goals
    pub logs: Vec<MealLog>,
}
