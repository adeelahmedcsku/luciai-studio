use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub release_date: String,
    pub download_url: String,
    pub changelog: Vec<String>,
    pub size_mb: f32,
    pub required: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSettings {
    pub auto_check: bool,
    pub auto_download: bool,
    pub auto_install: bool,
    pub check_interval_hours: u32,
    pub last_check: Option<String>,
}

impl Default for UpdateSettings {
    fn default() -> Self {
        Self {
            auto_check: true,
            auto_download: false,
            auto_install: false,
            check_interval_hours: 24,
            last_check: None,
        }
    }
}

pub struct AutoUpdater {
    current_version: String,
    update_url: String,
    settings_path: PathBuf,
}

impl AutoUpdater {
    pub fn new() -> Result<Self> {
        let app_dir = dirs::data_dir()
            .context("Failed to get data directory")?
            .join(".sai-ide");
        
        std::fs::create_dir_all(&app_dir)?;
        
        Ok(Self {
            current_version: env!("CARGO_PKG_VERSION").to_string(),
            update_url: "https://api.github.com/repos/yourusername/sai-ide/releases/latest".to_string(),
            settings_path: app_dir.join("update_settings.json"),
        })
    }
    
    /// Check for updates
    pub async fn check_for_updates(&self) -> Result<Option<UpdateInfo>> {
        tracing::info!("Checking for updates...");
        
        // Make HTTP request to check latest version
        let client = reqwest::Client::new();
        let response = client.get(&self.update_url)
            .header("User-Agent", "SAI-IDE")
            .send()
            .await?;
        
        if !response.status().is_success() {
            anyhow::bail!("Failed to check for updates: {}", response.status());
        }
        
        let release: GithubRelease = response.json().await?;
        
        // Compare versions
        if self.is_newer_version(&release.tag_name)? {
            let changelog = release.body
                .lines()
                .map(|s| s.to_string())
                .collect();
            
            // Find appropriate asset for current platform
            let download_url = self.get_download_url_for_platform(&release)?;
            
            let update_info = UpdateInfo {
                version: release.tag_name.clone(),
                release_date: release.published_at,
                download_url,
                changelog,
                size_mb: 50.0, // Approximate
                required: release.tag_name.contains("CRITICAL"),
            };
            
            tracing::info!("Update available: {}", update_info.version);
            Ok(Some(update_info))
        } else {
            tracing::info!("No updates available");
            Ok(None)
        }
    }
    
    /// Download update
    pub async fn download_update(&self, download_url: &str) -> Result<PathBuf> {
        tracing::info!("Downloading update from: {}", download_url);
        
        let client = reqwest::Client::new();
        let response = client.get(download_url)
            .send()
            .await?;
        
        if !response.status().is_success() {
            anyhow::bail!("Failed to download update: {}", response.status());
        }
        
        // Save to temp directory
        let temp_dir = std::env::temp_dir();
        let filename = download_url.split('/').last().unwrap_or("update");
        let download_path = temp_dir.join(filename);
        
        let bytes = response.bytes().await?;
        std::fs::write(&download_path, &bytes)?;
        
        tracing::info!("Update downloaded to: {:?}", download_path);
        Ok(download_path)
    }
    
    /// Install update (platform-specific)
    pub fn install_update(&self, update_path: &PathBuf) -> Result<()> {
        tracing::info!("Installing update from: {:?}", update_path);
        
        #[cfg(target_os = "windows")]
        {
            // On Windows, launch installer
            std::process::Command::new(update_path)
                .spawn()?;
        }
        
        #[cfg(target_os = "macos")]
        {
            // On macOS, mount DMG and copy app
            std::process::Command::new("open")
                .arg(update_path)
                .spawn()?;
        }
        
        #[cfg(target_os = "linux")]
        {
            // On Linux, install package
            if update_path.extension().and_then(|s| s.to_str()) == Some("deb") {
                std::process::Command::new("dpkg")
                    .args(&["-i", update_path.to_str().unwrap()])
                    .spawn()?;
            } else if update_path.extension().and_then(|s| s.to_str()) == Some("AppImage") {
                // Make AppImage executable and run
                std::process::Command::new("chmod")
                    .args(&["+x", update_path.to_str().unwrap()])
                    .output()?;
                
                std::process::Command::new(update_path)
                    .spawn()?;
            }
        }
        
        tracing::info!("Update installation initiated");
        Ok(())
    }
    
    /// Get update settings
    pub fn get_settings(&self) -> Result<UpdateSettings> {
        if !self.settings_path.exists() {
            return Ok(UpdateSettings::default());
        }
        
        let settings_str = std::fs::read_to_string(&self.settings_path)?;
        let settings: UpdateSettings = serde_json::from_str(&settings_str)?;
        Ok(settings)
    }
    
    /// Save update settings
    pub fn save_settings(&self, settings: &UpdateSettings) -> Result<()> {
        let settings_str = serde_json::to_string_pretty(settings)?;
        std::fs::write(&self.settings_path, settings_str)?;
        Ok(())
    }
    
    /// Check if update should be checked based on settings
    pub fn should_check_for_updates(&self) -> Result<bool> {
        let settings = self.get_settings()?;
        
        if !settings.auto_check {
            return Ok(false);
        }
        
        if let Some(last_check) = settings.last_check {
            let last_check_time = chrono::DateTime::parse_from_rfc3339(&last_check)?;
            let elapsed_hours = chrono::Utc::now()
                .signed_duration_since(last_check_time)
                .num_hours();
            
            Ok(elapsed_hours >= settings.check_interval_hours as i64)
        } else {
            Ok(true)
        }
    }
    
    /// Update last check time
    pub fn update_last_check(&self) -> Result<()> {
        let mut settings = self.get_settings()?;
        settings.last_check = Some(chrono::Utc::now().to_rfc3339());
        self.save_settings(&settings)
    }
    
    // Helper methods
    
    fn is_newer_version(&self, new_version: &str) -> Result<bool> {
        let current = self.parse_version(&self.current_version)?;
        let new = self.parse_version(new_version)?;
        
        Ok(new > current)
    }
    
    fn parse_version(&self, version: &str) -> Result<(u32, u32, u32)> {
        let version = version.trim_start_matches('v');
        let parts: Vec<&str> = version.split('.').collect();
        
        if parts.len() != 3 {
            anyhow::bail!("Invalid version format");
        }
        
        Ok((
            parts[0].parse()?,
            parts[1].parse()?,
            parts[2].parse()?,
        ))
    }
    
    fn get_download_url_for_platform(&self, release: &GithubRelease) -> Result<String> {
        #[cfg(target_os = "windows")]
        let platform_suffix = ".msi";
        
        #[cfg(target_os = "macos")]
        let platform_suffix = ".dmg";
        
        #[cfg(target_os = "linux")]
        let platform_suffix = ".AppImage";
        
        for asset in &release.assets {
            if asset.name.ends_with(platform_suffix) {
                return Ok(asset.browser_download_url.clone());
            }
        }
        
        anyhow::bail!("No suitable download found for this platform")
    }
}

#[derive(Debug, Deserialize)]
struct GithubRelease {
    tag_name: String,
    published_at: String,
    body: String,
    assets: Vec<GithubAsset>,
}

#[derive(Debug, Deserialize)]
struct GithubAsset {
    name: String,
    browser_download_url: String,
}

// Tauri commands

#[tauri::command]
pub async fn check_for_updates() -> Result<Option<UpdateInfo>, String> {
    let updater = AutoUpdater::new()
        .map_err(|e| e.to_string())?;
    
    updater.check_for_updates()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn download_update(download_url: String) -> Result<String, String> {
    let updater = AutoUpdater::new()
        .map_err(|e| e.to_string())?;
    
    let path = updater.download_update(&download_url)
        .await
        .map_err(|e| e.to_string())?;
    
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn install_update(update_path: String) -> Result<(), String> {
    let updater = AutoUpdater::new()
        .map_err(|e| e.to_string())?;
    
    updater.install_update(&PathBuf::from(update_path))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_update_settings() -> Result<UpdateSettings, String> {
    let updater = AutoUpdater::new()
        .map_err(|e| e.to_string())?;
    
    updater.get_settings()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_update_settings(settings: UpdateSettings) -> Result<(), String> {
    let updater = AutoUpdater::new()
        .map_err(|e| e.to_string())?;
    
    updater.save_settings(&settings)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_current_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}
