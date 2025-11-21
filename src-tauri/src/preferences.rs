use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPreferences {
    pub editor: EditorPreferences,
    pub llm: LLMPreferences,
    pub ui: UIPreferences,
    pub git: GitPreferences,
    pub projects: ProjectPreferences,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditorPreferences {
    pub theme: String,
    pub font_family: String,
    pub font_size: u32,
    pub tab_size: u32,
    pub insert_spaces: bool,
    pub word_wrap: bool,
    pub minimap_enabled: bool,
    pub line_numbers: bool,
    pub bracket_matching: bool,
    pub auto_save: bool,
    pub auto_save_delay: u32, // milliseconds
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMPreferences {
    pub default_model: String,
    pub temperature: f32,
    pub max_tokens: u32,
    pub streaming: bool,
    pub auto_validate: bool,
    pub auto_test: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIPreferences {
    pub theme: String, // "dark", "light", "auto"
    pub accent_color: String,
    pub compact_mode: bool,
    pub show_activity_bar: bool,
    pub show_status_bar: bool,
    pub show_minimap: bool,
    pub font_scale: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitPreferences {
    pub auto_fetch: bool,
    pub fetch_interval: u32, // minutes
    pub default_remote: String,
    pub commit_signing: bool,
    pub show_inline_diff: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectPreferences {
    pub default_directory: String,
    pub auto_init_git: bool,
    pub auto_install_deps: bool,
    pub default_license: String,
}

impl Default for UserPreferences {
    fn default() -> Self {
        Self {
            editor: EditorPreferences::default(),
            llm: LLMPreferences::default(),
            ui: UIPreferences::default(),
            git: GitPreferences::default(),
            projects: ProjectPreferences::default(),
        }
    }
}

impl Default for EditorPreferences {
    fn default() -> Self {
        Self {
            theme: "vs-dark".to_string(),
            font_family: "Fira Code, Consolas, monospace".to_string(),
            font_size: 14,
            tab_size: 2,
            insert_spaces: true,
            word_wrap: false,
            minimap_enabled: true,
            line_numbers: true,
            bracket_matching: true,
            auto_save: true,
            auto_save_delay: 1000,
        }
    }
}

impl Default for LLMPreferences {
    fn default() -> Self {
        Self {
            default_model: "deepseek-coder-v2:16b".to_string(),
            temperature: 0.7,
            max_tokens: 4096,
            streaming: true,
            auto_validate: true,
            auto_test: false,
        }
    }
}

impl Default for UIPreferences {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            accent_color: "#8b5cf6".to_string(), // Purple
            compact_mode: false,
            show_activity_bar: true,
            show_status_bar: true,
            show_minimap: true,
            font_scale: 1.0,
        }
    }
}

impl Default for GitPreferences {
    fn default() -> Self {
        Self {
            auto_fetch: false,
            fetch_interval: 5,
            default_remote: "origin".to_string(),
            commit_signing: false,
            show_inline_diff: true,
        }
    }
}

impl Default for ProjectPreferences {
    fn default() -> Self {
        Self {
            default_directory: dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join("Projects")
                .to_string_lossy()
                .to_string(),
            auto_init_git: true,
            auto_install_deps: false,
            default_license: "MIT".to_string(),
        }
    }
}

pub struct PreferencesManager {
    config_path: PathBuf,
}

impl PreferencesManager {
    pub fn new() -> Result<Self> {
        let config_dir = dirs::config_dir()
            .context("Failed to get config directory")?
            .join(".sai-ide");
        
        std::fs::create_dir_all(&config_dir)?;
        
        Ok(Self {
            config_path: config_dir.join("preferences.json"),
        })
    }
    
    pub fn load(&self) -> Result<UserPreferences> {
        if !self.config_path.exists() {
            let default = UserPreferences::default();
            self.save(&default)?;
            return Ok(default);
        }
        
        let json = std::fs::read_to_string(&self.config_path)?;
        let prefs: UserPreferences = serde_json::from_str(&json)?;
        
        Ok(prefs)
    }
    
    pub fn save(&self, preferences: &UserPreferences) -> Result<()> {
        let json = serde_json::to_string_pretty(preferences)?;
        std::fs::write(&self.config_path, json)?;
        
        tracing::info!("Saved preferences to {:?}", self.config_path);
        Ok(())
    }
    
    pub fn reset_to_default(&self) -> Result<UserPreferences> {
        let default = UserPreferences::default();
        self.save(&default)?;
        Ok(default)
    }
    
    pub fn export_to_file(&self, path: &PathBuf) -> Result<()> {
        let prefs = self.load()?;
        let json = serde_json::to_string_pretty(&prefs)?;
        std::fs::write(path, json)?;
        
        tracing::info!("Exported preferences to {:?}", path);
        Ok(())
    }
    
    pub fn import_from_file(&self, path: &PathBuf) -> Result<UserPreferences> {
        let json = std::fs::read_to_string(path)?;
        let prefs: UserPreferences = serde_json::from_str(&json)?;
        self.save(&prefs)?;
        
        tracing::info!("Imported preferences from {:?}", path);
        Ok(prefs)
    }
}

// Tauri commands
#[tauri::command]
pub async fn load_preferences() -> Result<UserPreferences, String> {
    let manager = PreferencesManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.load()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_preferences(preferences: UserPreferences) -> Result<(), String> {
    let manager = PreferencesManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.save(&preferences)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn reset_preferences() -> Result<UserPreferences, String> {
    let manager = PreferencesManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.reset_to_default()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_preferences(path: String) -> Result<(), String> {
    let manager = PreferencesManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.export_to_file(&PathBuf::from(path))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_preferences(path: String) -> Result<UserPreferences, String> {
    let manager = PreferencesManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.import_from_file(&PathBuf::from(path))
        .map_err(|e| e.to_string())
}
