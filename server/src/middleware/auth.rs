use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    Json,
    RequestPartsExt,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
// Assuming crate::handlers::auth is accessible
// If circular dependency issues arise (handlers use middleware?), we might need to move Claims to models.
// But middleware uses Claims, handlers produce Claims. No circular dependency unless handlers import middleware.
use crate::handlers::auth::Claims; 

const JWT_SECRET: &[u8] = b"supersecretkeyCHANGEME"; 

pub struct AuthUser {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, Json<serde_json::Value>);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Extract the token from the Authorization header
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "Missing or invalid token"}))))?;

        // Decode the user data
        let token_data = decode::<Claims>(
            bearer.token(),
            &DecodingKey::from_secret(JWT_SECRET),
            &Validation::default(),
        )
        .map_err(|_| (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "Invalid token"}))))?;

        Ok(AuthUser {
            user_id: token_data.claims.user_id,
        })
    }
}
