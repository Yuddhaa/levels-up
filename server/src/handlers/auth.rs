use axum::{
    extract::State,
    http::StatusCode,
    Json,
    response::IntoResponse,
};
use crate::state::AppState;
use crate::models::{RegisterRequest, LoginRequest, AuthResponse, UserProfile};
use std::sync::Arc;
use argon2::{
    password_hash::{
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2
};
use rand::rngs::OsRng;
use jsonwebtoken::{encode, Header, EncodingKey};
use serde::{Deserialize, Serialize};
use chrono::{Utc, Duration};

const JWT_SECRET: &[u8] = b"supersecretkeyCHANGEME"; // simpler for now, ideally env var

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub user_id: i64,
    pub exp: usize,
    pub iat: usize,
}

#[utoipa::path(
    post,
    path = "/auth/register",
    request_body = RegisterRequest,
    responses(
        (status = 200, description = "Register a user", body = AuthResponse),
        (status = 409, description = "User exists")
    )
)]
pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RegisterRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    // 1. Check if user exists
    let existing = sqlx::query!(
        "SELECT id FROM users WHERE username = $1 OR email = $2",
        payload.username,
        payload.email
    )
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))))?;

    if existing.is_some() {
        return Err((StatusCode::CONFLICT, Json(serde_json::json!({"error": "User already exists"}))));
    }

    // 2. Hash password
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(payload.password.as_bytes(), &salt)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": "Password hashing failed"}))))?
        .to_string();

    // 3. Insert user
    let user_id = sqlx::query!(
        r#"
        INSERT INTO users (username, email, password_hash, name, current_weight, start_weight, target_weight, height, age, gender)
        VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9)
        RETURNING id
        "#,
        payload.username, 
        payload.email, 
        password_hash, 
        payload.name,
        payload.current_weight,
        payload.target_weight,
        payload.height,
        payload.age,
        payload.gender
    )
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))))?
    .id;

    // 4. Generate Token
    let claims = Claims {
        sub: payload.username.clone(),
        user_id,
        iat: Utc::now().timestamp() as usize,
        exp: (Utc::now() + Duration::hours(24 * 7)).timestamp() as usize,
    };

    let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(JWT_SECRET))
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": "Token creation failed"}))))?;

    // 5. Fetch profile
    let profile = sqlx::query_as!(
         UserProfile,
         r#"SELECT 
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
            FROM users WHERE id = $1"#,
         user_id
    )
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))))?;

    Ok(Json(AuthResponse {
        token,
        user: profile
    }))
}

#[utoipa::path(
    post,
    path = "/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login user", body = AuthResponse),
        (status = 401, description = "Invalid credentials")
    )
)]
pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    // 1. Fetch user by username
    let user = sqlx::query!(
        r#"SELECT id as "id!", username as "username!", password_hash as "password_hash!" FROM users WHERE username = $1"#,
        payload.username
    )
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))))?;

    let user = match user {
        Some(u) => u,
        None => return Err((StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "Invalid credentials"})))),
    };

    // 2. Verify password
    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": "Hash error"}))))?;
    
    if Argon2::default().verify_password(payload.password.as_bytes(), &parsed_hash).is_err() {
         return Err((StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error": "Invalid credentials"}))));
    }

    // 3. Generate Token
    let claims = Claims {
        sub: user.username.clone(),
        user_id: user.id,
        iat: Utc::now().timestamp() as usize,
        exp: (Utc::now() + Duration::hours(24 * 7)).timestamp() as usize,
    };

    let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(JWT_SECRET))
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": "Token creation failed"}))))?;

    // 4. Fetch User Profile
     let profile = sqlx::query_as!(
         UserProfile,
         r#"SELECT 
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
            FROM users WHERE id = $1"#,
         user.id
    )
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"error": e.to_string()}))))?;

    Ok(Json(AuthResponse {
        token,
        user: profile
    }))
}
