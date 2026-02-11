use utoipa::OpenApi;
use crate::models::*;
use crate::handlers::*;

#[derive(OpenApi)]
#[openapi(
    paths(
        root,
        health_check,
        calculate_fitness,
        save_profile,
        get_dashboard_stats,
        add_weight_log,
        get_weight_history,
        award_xp
    ),
    components(
        schemas(UserProfile, FitnessRequest, FitnessResponse, DashboardStats, WeightLog, NewWeightLog, XPRequest)
    ),
    tags(
        (name = "level-up-fitness", description = "Fitness Tracking API")
    )
)]
pub struct ApiDoc;
