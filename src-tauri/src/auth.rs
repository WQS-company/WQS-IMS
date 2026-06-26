use bcrypt::{hash, verify};
use jsonwebtoken::{encode, Header, EncodingKey, decode, DecodingKey, Validation};
use serde::{Serialize, Deserialize};
use std::time::SystemTime;

pub fn hash_password(password: &str) -> Result<String, String> {
    hash(password, 10).map_err(|e| e.to_string())
}

pub fn verify_password(password: &str, password_hash: &str) -> bool {
    verify(password, password_hash).unwrap_or(false)
}

pub fn create_token(user_id: &str, secret: &str, role: Option<String>) -> Result<String, String> {
    let iat = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs() as usize;
    let exp = iat + 24 * 60 * 60;

    #[derive(Debug, Serialize, Deserialize)]
    struct Claims {
        sub: String,
        role: Option<String>,
        exp: usize,
        iat: usize,
        iss: String,
    }

    let claims = Claims {
        sub: user_id.to_string(),
        role,
        exp,
        iat,
        iss: "wqs-ims".to_string(),
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
    .map_err(|e| e.to_string())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenClaims {
    pub sub: String,
    pub role: Option<String>,
    pub exp: usize,
    pub iat: usize,
    pub iss: String,
}

pub fn verify_token(token: &str, secret: &str) -> Result<TokenClaims, String> {
    let mut validation = Validation::new(jsonwebtoken::Algorithm::HS256);
    validation.set_issuer(&["wqs-ims"]);

    let token_data = decode::<TokenClaims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &validation,
    )
    .map_err(|e| e.to_string())?;

    Ok(token_data.claims)
}
