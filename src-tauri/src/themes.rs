use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Theme {
    pub id: String,
    pub name: String,
    pub description: String,
    pub author: String,
    pub colors: ThemeColors,
    pub syntax: SyntaxColors,
    pub ui: UIColors,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeColors {
    pub background: String,
    pub foreground: String,
    pub primary: String,
    pub secondary: String,
    pub accent: String,
    pub error: String,
    pub warning: String,
    pub success: String,
    pub info: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyntaxColors {
    pub keyword: String,
    pub string: String,
    pub number: String,
    pub comment: String,
    pub function: String,
    pub variable: String,
    pub type_name: String,
    pub operator: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIColors {
    pub sidebar: String,
    pub editor: String,
    pub terminal: String,
    pub statusbar: String,
    pub border: String,
    pub hover: String,
    pub selection: String,
    pub active: String,
}

pub struct ThemeManager {
    themes: HashMap<String, Theme>,
}

impl ThemeManager {
    pub fn new() -> Self {
        let mut manager = Self {
            themes: HashMap::new(),
        };
        manager.initialize_default_themes();
        manager
    }
    
    fn initialize_default_themes(&mut self) {
        // Dark themes
        self.themes.insert("dark".to_string(), Self::create_dark_theme());
        self.themes.insert("dracula".to_string(), Self::create_dracula_theme());
        self.themes.insert("monokai".to_string(), Self::create_monokai_theme());
        self.themes.insert("nord".to_string(), Self::create_nord_theme());
        self.themes.insert("tokyo-night".to_string(), Self::create_tokyo_night_theme());
        
        // Light themes
        self.themes.insert("light".to_string(), Self::create_light_theme());
        self.themes.insert("github-light".to_string(), Self::create_github_light_theme());
        self.themes.insert("solarized-light".to_string(), Self::create_solarized_light_theme());
    }
    
    fn create_dark_theme() -> Theme {
        Theme {
            id: "dark".to_string(),
            name: "Dark".to_string(),
            description: "Default dark theme".to_string(),
            author: "SAI IDE".to_string(),
            colors: ThemeColors {
                background: "#1e1e1e".to_string(),
                foreground: "#d4d4d4".to_string(),
                primary: "#007acc".to_string(),
                secondary: "#3c3c3c".to_string(),
                accent: "#0098ff".to_string(),
                error: "#f48771".to_string(),
                warning: "#cca700".to_string(),
                success: "#89d185".to_string(),
                info: "#75beff".to_string(),
            },
            syntax: SyntaxColors {
                keyword: "#569cd6".to_string(),
                string: "#ce9178".to_string(),
                number: "#b5cea8".to_string(),
                comment: "#6a9955".to_string(),
                function: "#dcdcaa".to_string(),
                variable: "#9cdcfe".to_string(),
                type_name: "#4ec9b0".to_string(),
                operator: "#d4d4d4".to_string(),
            },
            ui: UIColors {
                sidebar: "#252526".to_string(),
                editor: "#1e1e1e".to_string(),
                terminal: "#1e1e1e".to_string(),
                statusbar: "#007acc".to_string(),
                border: "#3c3c3c".to_string(),
                hover: "#2a2d2e".to_string(),
                selection: "#264f78".to_string(),
                active: "#094771".to_string(),
            },
        }
    }
    
    fn create_dracula_theme() -> Theme {
        Theme {
            id: "dracula".to_string(),
            name: "Dracula".to_string(),
            description: "Dark theme with vibrant colors".to_string(),
            author: "Dracula Team".to_string(),
            colors: ThemeColors {
                background: "#282a36".to_string(),
                foreground: "#f8f8f2".to_string(),
                primary: "#bd93f9".to_string(),
                secondary: "#44475a".to_string(),
                accent: "#ff79c6".to_string(),
                error: "#ff5555".to_string(),
                warning: "#ffb86c".to_string(),
                success: "#50fa7b".to_string(),
                info: "#8be9fd".to_string(),
            },
            syntax: SyntaxColors {
                keyword: "#ff79c6".to_string(),
                string: "#f1fa8c".to_string(),
                number: "#bd93f9".to_string(),
                comment: "#6272a4".to_string(),
                function: "#50fa7b".to_string(),
                variable: "#f8f8f2".to_string(),
                type_name: "#8be9fd".to_string(),
                operator: "#ff79c6".to_string(),
            },
            ui: UIColors {
                sidebar: "#21222c".to_string(),
                editor: "#282a36".to_string(),
                terminal: "#282a36".to_string(),
                statusbar: "#6272a4".to_string(),
                border: "#44475a".to_string(),
                hover: "#44475a".to_string(),
                selection: "#44475a".to_string(),
                active: "#6272a4".to_string(),
            },
        }
    }
    
    fn create_monokai_theme() -> Theme {
        Theme {
            id: "monokai".to_string(),
            name: "Monokai".to_string(),
            description: "Classic Monokai theme".to_string(),
            author: "Sublime Text".to_string(),
            colors: ThemeColors {
                background: "#272822".to_string(),
                foreground: "#f8f8f2".to_string(),
                primary: "#f92672".to_string(),
                secondary: "#3e3d32".to_string(),
                accent: "#fd971f".to_string(),
                error: "#f92672".to_string(),
                warning: "#e6db74".to_string(),
                success: "#a6e22e".to_string(),
                info: "#66d9ef".to_string(),
            },
            syntax: SyntaxColors {
                keyword: "#f92672".to_string(),
                string: "#e6db74".to_string(),
                number: "#ae81ff".to_string(),
                comment: "#75715e".to_string(),
                function: "#a6e22e".to_string(),
                variable: "#f8f8f2".to_string(),
                type_name: "#66d9ef".to_string(),
                operator: "#f92672".to_string(),
            },
            ui: UIColors {
                sidebar: "#1e1f1c".to_string(),
                editor: "#272822".to_string(),
                terminal: "#272822".to_string(),
                statusbar: "#3e3d32".to_string(),
                border: "#3e3d32".to_string(),
                hover: "#3e3d32".to_string(),
                selection: "#49483e".to_string(),
                active: "#75715e".to_string(),
            },
        }
    }
    
    fn create_nord_theme() -> Theme {
        Theme {
            id: "nord".to_string(),
            name: "Nord".to_string(),
            description: "Arctic, north-bluish color palette".to_string(),
            author: "Arctic Ice Studio".to_string(),
            colors: ThemeColors {
                background: "#2e3440".to_string(),
                foreground: "#d8dee9".to_string(),
                primary: "#88c0d0".to_string(),
                secondary: "#3b4252".to_string(),
                accent: "#81a1c1".to_string(),
                error: "#bf616a".to_string(),
                warning: "#ebcb8b".to_string(),
                success: "#a3be8c".to_string(),
                info: "#88c0d0".to_string(),
            },
            syntax: SyntaxColors {
                keyword: "#81a1c1".to_string(),
                string: "#a3be8c".to_string(),
                number: "#b48ead".to_string(),
                comment: "#616e88".to_string(),
                function: "#88c0d0".to_string(),
                variable: "#d8dee9".to_string(),
                type_name: "#8fbcbb".to_string(),
                operator: "#81a1c1".to_string(),
            },
            ui: UIColors {
                sidebar: "#2e3440".to_string(),
                editor: "#2e3440".to_string(),
                terminal: "#2e3440".to_string(),
                statusbar: "#3b4252".to_string(),
                border: "#3b4252".to_string(),
                hover: "#434c5e".to_string(),
                selection: "#434c5e".to_string(),
                active: "#4c566a".to_string(),
            },
        }
    }
    
    fn create_tokyo_night_theme() -> Theme {
        Theme {
            id: "tokyo-night".to_string(),
            name: "Tokyo Night".to_string(),
            description: "A clean, dark theme inspired by Tokyo's night".to_string(),
            author: "Enkia".to_string(),
            colors: ThemeColors {
                background: "#1a1b26".to_string(),
                foreground: "#a9b1d6".to_string(),
                primary: "#7aa2f7".to_string(),
                secondary: "#24283b".to_string(),
                accent: "#bb9af7".to_string(),
                error: "#f7768e".to_string(),
                warning: "#e0af68".to_string(),
                success: "#9ece6a".to_string(),
                info: "#7dcfff".to_string(),
            },
            syntax: SyntaxColors {
                keyword: "#bb9af7".to_string(),
                string: "#9ece6a".to_string(),
                number: "#ff9e64".to_string(),
                comment: "#565f89".to_string(),
                function: "#7aa2f7".to_string(),
                variable: "#a9b1d6".to_string(),
                type_name: "#2ac3de".to_string(),
                operator: "#bb9af7".to_string(),
            },
            ui: UIColors {
                sidebar: "#16161e".to_string(),
                editor: "#1a1b26".to_string(),
                terminal: "#1a1b26".to_string(),
                statusbar: "#24283b".to_string(),
                border: "#24283b".to_string(),
                hover: "#292e42".to_string(),
                selection: "#283457".to_string(),
                active: "#3d59a1".to_string(),
            },
        }
    }
    
    fn create_light_theme() -> Theme {
        Theme {
            id: "light".to_string(),
            name: "Light".to_string(),
            description: "Default light theme".to_string(),
            author: "SAI IDE".to_string(),
            colors: ThemeColors {
                background: "#ffffff".to_string(),
                foreground: "#000000".to_string(),
                primary: "#0066cc".to_string(),
                secondary: "#f3f3f3".to_string(),
                accent: "#007acc".to_string(),
                error: "#e51400".to_string(),
                warning: "#bf8803".to_string(),
                success: "#09885a".to_string(),
                info: "#0068d6".to_string(),
            },
            syntax: SyntaxColors {
                keyword: "#0000ff".to_string(),
                string: "#a31515".to_string(),
                number: "#098658".to_string(),
                comment: "#008000".to_string(),
                function: "#795e26".to_string(),
                variable: "#001080".to_string(),
                type_name: "#267f99".to_string(),
                operator: "#000000".to_string(),
            },
            ui: UIColors {
                sidebar: "#f3f3f3".to_string(),
                editor: "#ffffff".to_string(),
                terminal: "#ffffff".to_string(),
                statusbar: "#007acc".to_string(),
                border: "#cccccc".to_string(),
                hover: "#e8e8e8".to_string(),
                selection: "#add6ff".to_string(),
                active: "#0066cc".to_string(),
            },
        }
    }
    
    fn create_github_light_theme() -> Theme {
        Theme {
            id: "github-light".to_string(),
            name: "GitHub Light".to_string(),
            description: "Light theme inspired by GitHub".to_string(),
            author: "GitHub".to_string(),
            colors: ThemeColors {
                background: "#ffffff".to_string(),
                foreground: "#24292e".to_string(),
                primary: "#0366d6".to_string(),
                secondary: "#f6f8fa".to_string(),
                accent: "#0366d6".to_string(),
                error: "#d73a49".to_string(),
                warning: "#ffd33d".to_string(),
                success: "#28a745".to_string(),
                info: "#0366d6".to_string(),
            },
            syntax: SyntaxColors {
                keyword: "#d73a49".to_string(),
                string: "#032f62".to_string(),
                number: "#005cc5".to_string(),
                comment: "#6a737d".to_string(),
                function: "#6f42c1".to_string(),
                variable: "#24292e".to_string(),
                type_name: "#005cc5".to_string(),
                operator: "#d73a49".to_string(),
            },
            ui: UIColors {
                sidebar: "#f6f8fa".to_string(),
                editor: "#ffffff".to_string(),
                terminal: "#ffffff".to_string(),
                statusbar: "#24292e".to_string(),
                border: "#e1e4e8".to_string(),
                hover: "#f6f8fa".to_string(),
                selection: "#c8e1ff".to_string(),
                active: "#0366d6".to_string(),
            },
        }
    }
    
    fn create_solarized_light_theme() -> Theme {
        Theme {
            id: "solarized-light".to_string(),
            name: "Solarized Light".to_string(),
            description: "Precision colors for machines and people".to_string(),
            author: "Ethan Schoonover".to_string(),
            colors: ThemeColors {
                background: "#fdf6e3".to_string(),
                foreground: "#657b83".to_string(),
                primary: "#268bd2".to_string(),
                secondary: "#eee8d5".to_string(),
                accent: "#2aa198".to_string(),
                error: "#dc322f".to_string(),
                warning: "#b58900".to_string(),
                success: "#859900".to_string(),
                info: "#268bd2".to_string(),
            },
            syntax: SyntaxColors {
                keyword: "#859900".to_string(),
                string: "#2aa198".to_string(),
                number: "#d33682".to_string(),
                comment: "#93a1a1".to_string(),
                function: "#268bd2".to_string(),
                variable: "#657b83".to_string(),
                type_name: "#b58900".to_string(),
                operator: "#859900".to_string(),
            },
            ui: UIColors {
                sidebar: "#eee8d5".to_string(),
                editor: "#fdf6e3".to_string(),
                terminal: "#fdf6e3".to_string(),
                statusbar: "#93a1a1".to_string(),
                border: "#eee8d5".to_string(),
                hover: "#eee8d5".to_string(),
                selection: "#eee8d5".to_string(),
                active: "#93a1a1".to_string(),
            },
        }
    }
    
    pub fn get_theme(&self, id: &str) -> Option<&Theme> {
        self.themes.get(id)
    }
    
    pub fn list_themes(&self) -> Vec<&Theme> {
        self.themes.values().collect()
    }
    
    pub fn add_custom_theme(&mut self, theme: Theme) {
        self.themes.insert(theme.id.clone(), theme);
    }
    
    pub fn export_theme(&self, id: &str) -> Result<String> {
        if let Some(theme) = self.themes.get(id) {
            Ok(serde_json::to_string_pretty(theme)?)
        } else {
            anyhow::bail!("Theme not found")
        }
    }
    
    pub fn import_theme(&mut self, json: &str) -> Result<String> {
        let theme: Theme = serde_json::from_str(json)?;
        let id = theme.id.clone();
        self.themes.insert(id.clone(), theme);
        Ok(id)
    }
}

// Tauri commands

#[tauri::command]
pub async fn list_all_themes() -> Result<Vec<Theme>, String> {
    let manager = ThemeManager::new();
    Ok(manager.list_themes().into_iter().cloned().collect())
}

#[tauri::command]
pub async fn get_theme_by_id(theme_id: String) -> Result<Option<Theme>, String> {
    let manager = ThemeManager::new();
    Ok(manager.get_theme(&theme_id).cloned())
}

#[tauri::command]
pub async fn export_theme_json(theme_id: String) -> Result<String, String> {
    let manager = ThemeManager::new();
    manager.export_theme(&theme_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_theme_json(json: String) -> Result<String, String> {
    let mut manager = ThemeManager::new();
    manager.import_theme(&json).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_theme(theme: Theme) -> Result<(), String> {
    let mut manager = ThemeManager::new();
    manager.add_custom_theme(theme);
    Ok(())
}
