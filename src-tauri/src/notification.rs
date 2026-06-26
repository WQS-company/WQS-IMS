use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum NotificationError {
    #[error("Permission denied")]
    PermissionDenied,
    #[error("Notification not supported")]
    NotSupported,
    #[error("Invalid data: {0}")]
    InvalidData(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationOptions {
    pub icon: Option<String>,
    pub duration: u32,
    pub data: Option<serde_json::Value>,
    pub tag: Option<String>,
    pub renotify: bool,
}

pub struct NotificationManager;

impl NotificationManager {
    pub fn new() -> Self {
        Self
    }

    pub async fn request_permission(&self) -> Result<(), NotificationError> {
        Ok(())
    }

    pub async fn send_local(&self, _title: String, _body: String, _options: NotificationOptions) -> Result<String, NotificationError> {
        let id = uuid::Uuid::new_v4().to_string();
        Ok(id)
    }
}
