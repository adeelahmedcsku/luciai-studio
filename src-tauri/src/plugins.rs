use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use std::path::PathBuf;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plugin {
    pub id: String,
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: String,
    pub entry_point: String,
    pub permissions: Vec<Permission>,
    pub enabled: bool,
    pub install_date: String,
    pub last_updated: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Permission {
    FileSystem,
    Network,
    LLM,
    UI,
    Terminal,
    Git,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub name: String,
    pub version: String,
    pub author: String,
    pub description: String,
    pub entry: String,
    pub permissions: Vec<Permission>,
    pub dependencies: HashMap<String, String>,
}

pub struct PluginManager {
    plugins_dir: PathBuf,
}

impl PluginManager {
    pub fn new() -> Result<Self> {
        let plugins_dir = dirs::data_dir()
            .context("Failed to get data directory")?
            .join(".sai-ide")
            .join("plugins");
        
        std::fs::create_dir_all(&plugins_dir)?;
        
        Ok(Self { plugins_dir })
    }
    
    /// Load all plugins
    pub fn load_plugins(&self) -> Result<Vec<Plugin>> {
        let mut plugins = Vec::new();
        
        if !self.plugins_dir.exists() {
            return Ok(plugins);
        }
        
        for entry in std::fs::read_dir(&self.plugins_dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                if let Ok(plugin) = self.load_plugin(&path) {
                    plugins.push(plugin);
                }
            }
        }
        
        tracing::info!("Loaded {} plugins", plugins.len());
        Ok(plugins)
    }
    
    /// Load a single plugin
    fn load_plugin(&self, plugin_dir: &PathBuf) -> Result<Plugin> {
        let manifest_path = plugin_dir.join("plugin.json");
        
        if !manifest_path.exists() {
            anyhow::bail!("Plugin manifest not found");
        }
        
        let manifest_str = std::fs::read_to_string(&manifest_path)?;
        let manifest: PluginManifest = serde_json::from_str(&manifest_str)?;
        
        let plugin_id = plugin_dir.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();
        
        let metadata = std::fs::metadata(&manifest_path)?;
        let install_date = chrono::DateTime::<chrono::Utc>::from(
            metadata.created().unwrap_or(std::time::SystemTime::now())
        ).to_rfc3339();
        
        let last_updated = chrono::DateTime::<chrono::Utc>::from(
            metadata.modified().unwrap_or(std::time::SystemTime::now())
        ).to_rfc3339();
        
        Ok(Plugin {
            id: plugin_id,
            name: manifest.name,
            version: manifest.version,
            author: manifest.author,
            description: manifest.description,
            entry_point: manifest.entry,
            permissions: manifest.permissions,
            enabled: true,
            install_date,
            last_updated,
        })
    }
    
    /// Get plugin by ID
    pub fn get_plugin(&self, plugin_id: &str) -> Result<Option<Plugin>> {
        let plugin_dir = self.plugins_dir.join(plugin_id);
        
        if !plugin_dir.exists() {
            return Ok(None);
        }
        
        match self.load_plugin(&plugin_dir) {
            Ok(plugin) => Ok(Some(plugin)),
            Err(_) => Ok(None),
        }
    }
    
    /// Enable/disable plugin
    pub fn toggle_plugin(&self, plugin_id: &str, enabled: bool) -> Result<()> {
        let plugin_dir = self.plugins_dir.join(plugin_id);
        let state_file = plugin_dir.join(".state");
        
        let state = serde_json::json!({
            "enabled": enabled
        });
        
        std::fs::write(&state_file, serde_json::to_string_pretty(&state)?)?;
        
        tracing::info!("Plugin {} {}", plugin_id, if enabled { "enabled" } else { "disabled" });
        Ok(())
    }
    
    /// Install plugin from path
    pub fn install_plugin(&self, plugin_path: &PathBuf) -> Result<Plugin> {
        // Read manifest
        let manifest_path = plugin_path.join("plugin.json");
        if !manifest_path.exists() {
            anyhow::bail!("Invalid plugin: manifest not found");
        }
        
        let manifest_str = std::fs::read_to_string(&manifest_path)?;
        let manifest: PluginManifest = serde_json::from_str(&manifest_str)?;
        
        // Generate plugin ID
        let plugin_id = self.generate_plugin_id(&manifest.name);
        let dest_dir = self.plugins_dir.join(&plugin_id);
        
        // Copy plugin files
        self.copy_dir(plugin_path, &dest_dir)?;
        
        tracing::info!("Installed plugin: {}", manifest.name);
        
        self.load_plugin(&dest_dir)
    }
    
    /// Uninstall plugin
    pub fn uninstall_plugin(&self, plugin_id: &str) -> Result<()> {
        let plugin_dir = self.plugins_dir.join(plugin_id);
        
        if plugin_dir.exists() {
            std::fs::remove_dir_all(&plugin_dir)?;
            tracing::info!("Uninstalled plugin: {}", plugin_id);
        }
        
        Ok(())
    }
    
    /// Execute plugin command
    pub async fn execute_plugin(&self, plugin_id: &str, command: &str, args: Vec<String>) -> Result<String> {
        let plugin = self.get_plugin(plugin_id)?
            .context("Plugin not found")?;
        
        if !plugin.enabled {
            anyhow::bail!("Plugin is disabled");
        }
        
        let plugin_dir = self.plugins_dir.join(plugin_id);
        let entry_script = plugin_dir.join(&plugin.entry_point);
        
        if !entry_script.exists() {
            anyhow::bail!("Plugin entry point not found");
        }
        
        // Execute plugin (example: run as Node.js script)
        let output = std::process::Command::new("node")
            .arg(&entry_script)
            .arg(command)
            .args(args)
            .current_dir(&plugin_dir)
            .output()?;
        
        let result = String::from_utf8_lossy(&output.stdout).to_string();
        Ok(result)
    }
    
    /// Search plugins in marketplace (mock implementation)
    pub async fn search_marketplace(&self, query: &str) -> Result<Vec<MarketplacePlugin>> {
        // In production, this would query an actual marketplace API
        let mock_plugins = vec![
            MarketplacePlugin {
                id: "prettier-plugin".to_string(),
                name: "Prettier Code Formatter".to_string(),
                description: "Format code with Prettier".to_string(),
                author: "Community".to_string(),
                version: "1.0.0".to_string(),
                downloads: 1250,
                rating: 4.8,
            },
            MarketplacePlugin {
                id: "eslint-plugin".to_string(),
                name: "ESLint Linter".to_string(),
                description: "Lint JavaScript code".to_string(),
                author: "Community".to_string(),
                version: "1.0.0".to_string(),
                downloads: 980,
                rating: 4.5,
            },
        ];
        
        let query_lower = query.to_lowercase();
        Ok(mock_plugins.into_iter()
            .filter(|p| {
                p.name.to_lowercase().contains(&query_lower) ||
                p.description.to_lowercase().contains(&query_lower)
            })
            .collect())
    }
    
    // Helper methods
    
    fn generate_plugin_id(&self, name: &str) -> String {
        name.to_lowercase()
            .replace(" ", "-")
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '-')
            .collect()
    }
    
    fn copy_dir(&self, src: &PathBuf, dst: &PathBuf) -> Result<()> {
        std::fs::create_dir_all(dst)?;
        
        for entry in std::fs::read_dir(src)? {
            let entry = entry?;
            let src_path = entry.path();
            let dst_path = dst.join(entry.file_name());
            
            if src_path.is_dir() {
                self.copy_dir(&src_path, &dst_path)?;
            } else {
                std::fs::copy(&src_path, &dst_path)?;
            }
        }
        
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketplacePlugin {
    pub id: String,
    pub name: String,
    pub description: String,
    pub author: String,
    pub version: String,
    pub downloads: u32,
    pub rating: f32,
}

// Tauri commands

#[tauri::command]
pub async fn list_plugins() -> Result<Vec<Plugin>, String> {
    let manager = PluginManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.load_plugins()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_plugin_info(plugin_id: String) -> Result<Option<Plugin>, String> {
    let manager = PluginManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.get_plugin(&plugin_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn toggle_plugin_enabled(plugin_id: String, enabled: bool) -> Result<(), String> {
    let manager = PluginManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.toggle_plugin(&plugin_id, enabled)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn install_plugin_from_path(path: String) -> Result<Plugin, String> {
    let manager = PluginManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.install_plugin(&PathBuf::from(path))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn uninstall_plugin(plugin_id: String) -> Result<(), String> {
    let manager = PluginManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.uninstall_plugin(&plugin_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn execute_plugin_command(
    plugin_id: String,
    command: String,
    args: Vec<String>
) -> Result<String, String> {
    let manager = PluginManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.execute_plugin(&plugin_id, &command, args)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_plugin_marketplace(query: String) -> Result<Vec<MarketplacePlugin>, String> {
    let manager = PluginManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.search_marketplace(&query)
        .await
        .map_err(|e| e.to_string())
}
