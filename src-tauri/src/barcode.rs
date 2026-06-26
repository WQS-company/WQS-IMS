use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum BarcodeError {
    #[error("Scanner not found")]
    ScannerNotFound,
    #[error("Permission denied")]
    PermissionDenied,
    #[error("Scan timeout")]
    ScanTimeout,
    #[error("Parse error: {0}")]
    ParseError(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub data: String,
    pub format: BarcodeFormat,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub scanner_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BarcodeFormat {
    Code39,
    Code128,
    Ean13,
    Ean8,
    Upca,
    Upce,
    QrCode,
    Unknown(String),
}

#[derive(Debug, Clone)]
pub enum ScanMode {
    Continuous,
    Trigger,
    Manual,
}

pub struct BarcodeScanner {
    scan_mode: ScanMode,
}

impl BarcodeScanner {
    pub fn new() -> Self {
        Self {
            scan_mode: ScanMode::Continuous,
        }
    }

    pub async fn scan_once(&self) -> Result<ScanResult, BarcodeError> {
        todo!()
    }
}
