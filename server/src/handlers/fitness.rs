use axum::Json;
use crate::models::{FitnessRequest, FitnessResponse};

#[utoipa::path(
    post,
    path = "/calculate-fitness",
    request_body = FitnessRequest,
    responses(
        (status = 200, description = "Calculate fitness metrics", body = FitnessResponse)
    )
)]
pub async fn calculate_fitness(Json(payload): Json<FitnessRequest>) -> Json<FitnessResponse> {
    let height_m = payload.height / 100.0;
    let bmi = payload.weight / (height_m * height_m);
    let bmi_category = if bmi < 18.5 { "Underweight" } else if bmi < 25.0 { "Normal Weight" } else if bmi < 30.0 { "Overweight" } else { "Obese" };
    let base_bmr = (10.0 * payload.weight) + (6.25 * payload.height) - (5.0 * payload.age as f64);
    let bmr = if payload.gender.to_lowercase() == "male" { base_bmr + 5.0 } else { base_bmr - 161.0 };
    let tdee = bmr * 1.2;
    Json(FitnessResponse {
        bmi: (bmi * 10.0).round() / 10.0,
        bmi_category: bmi_category.to_string(),
        bmr: bmr.round(),
        tdee_sedentary: tdee.round(),
    })
}
