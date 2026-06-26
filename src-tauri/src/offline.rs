use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum SyncError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Network error: {0}")]
    Network(String),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Parse error: {0}")]
    Parse(String),
    #[error("Lock error: {0}")]
    Lock(String),
    #[error("Sync already in progress")]
    AlreadySyncing,
    #[error("Conflict detected")]
    Conflict,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncQueueItem {
    pub id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub operation: SyncOperation,
    pub data: Option<String>,
    pub attempts: i32,
    pub last_error: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncOperation {
    Create,
    Update,
    Delete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfflineEntity {
    pub id: String,
    pub entity_type: String,
    pub data: String,
    pub local_version: i64,
    pub server_version: Option<i64>,
    pub synced_at: Option<chrono::DateTime<chrono::Utc>>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SyncStatus {
    Idle,
    Syncing,
    Error(String),
    Completed,
}

pub struct SyncManager {
    pool: sqlx::MySqlPool,
    sync_enabled: bool,
    status: SyncStatus,
}

impl SyncManager {
    pub fn new(pool: sqlx::MySqlPool) -> Self {
        Self {
            pool,
            sync_enabled: true,
            status: SyncStatus::Idle,
        }
    }

    pub async fn hydrate(&self) -> Result<(), SyncError> {
        Ok(())
    }

    pub fn enable_sync(&mut self, enabled: bool) {
        self.sync_enabled = enabled;
    }

    pub fn get_status(&self) -> &SyncStatus {
        &self.status
    }
}
