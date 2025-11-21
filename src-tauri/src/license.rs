use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::path::PathBuf;
use anyhow::{Result, Context};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicensePayload {
    pub key: String,
    pub email: String,
    pub tier: String,
    pub issued_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
    pub features: Vec<String>,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivationCertificate {
    pub payload: LicensePayload,
    pub signature: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status")]
pub enum LicenseStatus {
    NotActivated,
    Valid { payload: LicensePayload },
    Expired { payload: LicensePayload },
    Invalid { reason: String },
}

pub struct LicenseValidator {
    license_path: PathBuf,
}

impl LicenseValidator {
    pub fn new() -> Result<Self> {
        let app_dir = dirs::data_dir()
            .context("Failed to get data directory")?
            .join(".sai-ide");
        
        std::fs::create_dir_all(&app_dir)?;
        
        let license_path = app_dir.join("license.json");
        
        Ok(Self { license_path })
    }
    
    pub fn check_status(&self) -> Result<LicenseStatus> {
        // Check if license file exists
        if !self.license_path.exists() {
            return Ok(LicenseStatus::NotActivated);
        }
        
        // Load license file
        let license_data = std::fs::read_to_string(&self.license_path)?;
        let cert: ActivationCertificate = serde_json::from_str(&license_data)?;
        
        // For MVP, we'll do basic validation
        // TODO: Implement RSA signature verification
        
        // Check expiration
        if let Some(expires_at) = cert.payload.expires_at {
            if Utc::now() > expires_at {
                return Ok(LicenseStatus::Expired { 
                    payload: cert.payload 
                });
            }
        }
        
        Ok(LicenseStatus::Valid { 
            payload: cert.payload 
        })
    }
    
    pub fn activate(&self, license_key: String, cert_json: String) -> Result<()> {
        // Parse certificate
        let cert: ActivationCertificate = serde_json::from_str(&cert_json)?;
        
        // Verify key matches
        if cert.payload.key != license_key {
            anyhow::bail!("License key mismatch");
        }
        
        // Save to file
        std::fs::write(&self.license_path, cert_json)?;
        
        tracing::info!("License activated successfully");
        Ok(())
    }
}

// Tauri commands

#[tauri::command]
pub async fn check_license_status() -> Result<LicenseStatus, String> {
    let validator = LicenseValidator::new()
        .map_err(|e| e.to_string())?;
    
    validator.check_status()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn activate_license(
    license_key: String,
    certificate: String
) -> Result<(), String> {
    let validator = LicenseValidator::new()
        .map_err(|e| e.to_string())?;
    
    validator.activate(license_key, certificate)
        .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_license_creation() {
        let payload = LicensePayload {
            key: "TEST-1234-5678-9012".to_string(),
            email: "test@example.com".to_string(),
            tier: "annual".to_string(),
            issued_at: Utc::now(),
            expires_at: Some(Utc::now() + chrono::Duration::days(365)),
            features: vec!["unlimited_projects".to_string()],
            version: "1.0".to_string(),
        };
        
        assert_eq!(payload.tier, "annual");
    }
}
