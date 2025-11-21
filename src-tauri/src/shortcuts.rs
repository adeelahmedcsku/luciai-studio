use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyboardShortcut {
    pub id: String,
    pub name: String,
    pub description: String,
    pub key: String, // e.g., "Ctrl+S", "Cmd+Shift+P"
    pub command: String,
    pub category: ShortcutCategory,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ShortcutCategory {
    File,
    Edit,
    View,
    Search,
    Git,
    Terminal,
    Debug,
    AI,
    Navigation,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortcutProfile {
    pub name: String,
    pub shortcuts: Vec<KeyboardShortcut>,
}

pub struct ShortcutManager {
    shortcuts: HashMap<String, KeyboardShortcut>,
}

impl ShortcutManager {
    pub fn new() -> Self {
        let mut manager = Self {
            shortcuts: HashMap::new(),
        };
        manager.initialize_default_shortcuts();
        manager
    }
    
    fn initialize_default_shortcuts(&mut self) {
        let defaults = vec![
            // File operations
            KeyboardShortcut {
                id: "file.new".to_string(),
                name: "New File".to_string(),
                description: "Create a new file".to_string(),
                key: "Ctrl+N".to_string(),
                command: "file.new".to_string(),
                category: ShortcutCategory::File,
                enabled: true,
            },
            KeyboardShortcut {
                id: "file.save".to_string(),
                name: "Save File".to_string(),
                description: "Save the current file".to_string(),
                key: "Ctrl+S".to_string(),
                command: "file.save".to_string(),
                category: ShortcutCategory::File,
                enabled: true,
            },
            KeyboardShortcut {
                id: "file.saveAll".to_string(),
                name: "Save All".to_string(),
                description: "Save all open files".to_string(),
                key: "Ctrl+K S".to_string(),
                command: "file.saveAll".to_string(),
                category: ShortcutCategory::File,
                enabled: true,
            },
            KeyboardShortcut {
                id: "file.close".to_string(),
                name: "Close File".to_string(),
                description: "Close the current file".to_string(),
                key: "Ctrl+W".to_string(),
                command: "file.close".to_string(),
                category: ShortcutCategory::File,
                enabled: true,
            },
            
            // Edit operations
            KeyboardShortcut {
                id: "edit.undo".to_string(),
                name: "Undo".to_string(),
                description: "Undo the last action".to_string(),
                key: "Ctrl+Z".to_string(),
                command: "edit.undo".to_string(),
                category: ShortcutCategory::Edit,
                enabled: true,
            },
            KeyboardShortcut {
                id: "edit.redo".to_string(),
                name: "Redo".to_string(),
                description: "Redo the last undone action".to_string(),
                key: "Ctrl+Y".to_string(),
                command: "edit.redo".to_string(),
                category: ShortcutCategory::Edit,
                enabled: true,
            },
            KeyboardShortcut {
                id: "edit.cut".to_string(),
                name: "Cut".to_string(),
                description: "Cut selected text".to_string(),
                key: "Ctrl+X".to_string(),
                command: "edit.cut".to_string(),
                category: ShortcutCategory::Edit,
                enabled: true,
            },
            KeyboardShortcut {
                id: "edit.copy".to_string(),
                name: "Copy".to_string(),
                description: "Copy selected text".to_string(),
                key: "Ctrl+C".to_string(),
                command: "edit.copy".to_string(),
                category: ShortcutCategory::Edit,
                enabled: true,
            },
            KeyboardShortcut {
                id: "edit.paste".to_string(),
                name: "Paste".to_string(),
                description: "Paste from clipboard".to_string(),
                key: "Ctrl+V".to_string(),
                command: "edit.paste".to_string(),
                category: ShortcutCategory::Edit,
                enabled: true,
            },
            KeyboardShortcut {
                id: "edit.format".to_string(),
                name: "Format Document".to_string(),
                description: "Format the current document".to_string(),
                key: "Shift+Alt+F".to_string(),
                command: "edit.format".to_string(),
                category: ShortcutCategory::Edit,
                enabled: true,
            },
            
            // Search operations
            KeyboardShortcut {
                id: "search.find".to_string(),
                name: "Find".to_string(),
                description: "Find in current file".to_string(),
                key: "Ctrl+F".to_string(),
                command: "search.find".to_string(),
                category: ShortcutCategory::Search,
                enabled: true,
            },
            KeyboardShortcut {
                id: "search.replace".to_string(),
                name: "Replace".to_string(),
                description: "Find and replace".to_string(),
                key: "Ctrl+H".to_string(),
                command: "search.replace".to_string(),
                category: ShortcutCategory::Search,
                enabled: true,
            },
            KeyboardShortcut {
                id: "search.findInFiles".to_string(),
                name: "Find in Files".to_string(),
                description: "Search across all files".to_string(),
                key: "Ctrl+Shift+F".to_string(),
                command: "search.findInFiles".to_string(),
                category: ShortcutCategory::Search,
                enabled: true,
            },
            
            // View operations
            KeyboardShortcut {
                id: "view.commandPalette".to_string(),
                name: "Command Palette".to_string(),
                description: "Open command palette".to_string(),
                key: "Ctrl+Shift+P".to_string(),
                command: "view.commandPalette".to_string(),
                category: ShortcutCategory::View,
                enabled: true,
            },
            KeyboardShortcut {
                id: "view.toggleSidebar".to_string(),
                name: "Toggle Sidebar".to_string(),
                description: "Show/hide sidebar".to_string(),
                key: "Ctrl+B".to_string(),
                command: "view.toggleSidebar".to_string(),
                category: ShortcutCategory::View,
                enabled: true,
            },
            KeyboardShortcut {
                id: "view.toggleTerminal".to_string(),
                name: "Toggle Terminal".to_string(),
                description: "Show/hide terminal".to_string(),
                key: "Ctrl+`".to_string(),
                command: "view.toggleTerminal".to_string(),
                category: ShortcutCategory::View,
                enabled: true,
            },
            
            // Git operations
            KeyboardShortcut {
                id: "git.commit".to_string(),
                name: "Git Commit".to_string(),
                description: "Commit staged changes".to_string(),
                key: "Ctrl+Shift+G".to_string(),
                command: "git.commit".to_string(),
                category: ShortcutCategory::Git,
                enabled: true,
            },
            KeyboardShortcut {
                id: "git.push".to_string(),
                name: "Git Push".to_string(),
                description: "Push to remote".to_string(),
                key: "Ctrl+Shift+K".to_string(),
                command: "git.push".to_string(),
                category: ShortcutCategory::Git,
                enabled: true,
            },
            
            // AI operations
            KeyboardShortcut {
                id: "ai.chat".to_string(),
                name: "Open AI Chat".to_string(),
                description: "Open AI assistant chat".to_string(),
                key: "Ctrl+Shift+A".to_string(),
                command: "ai.chat".to_string(),
                category: ShortcutCategory::AI,
                enabled: true,
            },
            KeyboardShortcut {
                id: "ai.explain".to_string(),
                name: "Explain Code".to_string(),
                description: "Explain selected code".to_string(),
                key: "Ctrl+Shift+E".to_string(),
                command: "ai.explain".to_string(),
                category: ShortcutCategory::AI,
                enabled: true,
            },
            KeyboardShortcut {
                id: "ai.refactor".to_string(),
                name: "Refactor Code".to_string(),
                description: "Refactor selected code".to_string(),
                key: "Ctrl+Shift+R".to_string(),
                command: "ai.refactor".to_string(),
                category: ShortcutCategory::AI,
                enabled: true,
            },
            KeyboardShortcut {
                id: "ai.generate".to_string(),
                name: "Generate Project".to_string(),
                description: "Generate new project".to_string(),
                key: "Ctrl+Shift+N".to_string(),
                command: "ai.generate".to_string(),
                category: ShortcutCategory::AI,
                enabled: true,
            },
            
            // Navigation
            KeyboardShortcut {
                id: "nav.goToFile".to_string(),
                name: "Go to File".to_string(),
                description: "Quick file navigation".to_string(),
                key: "Ctrl+P".to_string(),
                command: "nav.goToFile".to_string(),
                category: ShortcutCategory::Navigation,
                enabled: true,
            },
            KeyboardShortcut {
                id: "nav.goToLine".to_string(),
                name: "Go to Line".to_string(),
                description: "Jump to specific line".to_string(),
                key: "Ctrl+G".to_string(),
                command: "nav.goToLine".to_string(),
                category: ShortcutCategory::Navigation,
                enabled: true,
            },
            KeyboardShortcut {
                id: "nav.nextTab".to_string(),
                name: "Next Tab".to_string(),
                description: "Switch to next tab".to_string(),
                key: "Ctrl+Tab".to_string(),
                command: "nav.nextTab".to_string(),
                category: ShortcutCategory::Navigation,
                enabled: true,
            },
            KeyboardShortcut {
                id: "nav.prevTab".to_string(),
                name: "Previous Tab".to_string(),
                description: "Switch to previous tab".to_string(),
                key: "Ctrl+Shift+Tab".to_string(),
                command: "nav.prevTab".to_string(),
                category: ShortcutCategory::Navigation,
                enabled: true,
            },
        ];
        
        for shortcut in defaults {
            self.shortcuts.insert(shortcut.id.clone(), shortcut);
        }
    }
    
    pub fn get_all_shortcuts(&self) -> Vec<KeyboardShortcut> {
        self.shortcuts.values().cloned().collect()
    }
    
    pub fn get_by_category(&self, category: &ShortcutCategory) -> Vec<KeyboardShortcut> {
        self.shortcuts.values()
            .filter(|s| &s.category == category)
            .cloned()
            .collect()
    }
    
    pub fn get_shortcut(&self, id: &str) -> Option<KeyboardShortcut> {
        self.shortcuts.get(id).cloned()
    }
    
    pub fn update_shortcut(&mut self, shortcut: KeyboardShortcut) -> Result<()> {
        self.shortcuts.insert(shortcut.id.clone(), shortcut);
        Ok(())
    }
    
    pub fn reset_to_defaults(&mut self) {
        self.shortcuts.clear();
        self.initialize_default_shortcuts();
    }
}

// Tauri commands
#[tauri::command]
pub async fn get_all_shortcuts() -> Result<Vec<KeyboardShortcut>, String> {
    let manager = ShortcutManager::new();
    Ok(manager.get_all_shortcuts())
}

#[tauri::command]
pub async fn get_shortcuts_by_category(category: String) -> Result<Vec<KeyboardShortcut>, String> {
    let manager = ShortcutManager::new();
    let cat = match category.as_str() {
        "File" => ShortcutCategory::File,
        "Edit" => ShortcutCategory::Edit,
        "View" => ShortcutCategory::View,
        "Search" => ShortcutCategory::Search,
        "Git" => ShortcutCategory::Git,
        "Terminal" => ShortcutCategory::Terminal,
        "Debug" => ShortcutCategory::Debug,
        "AI" => ShortcutCategory::AI,
        "Navigation" => ShortcutCategory::Navigation,
        _ => ShortcutCategory::Custom,
    };
    Ok(manager.get_by_category(&cat))
}

#[tauri::command]
pub async fn update_keyboard_shortcut(shortcut: KeyboardShortcut) -> Result<(), String> {
    let mut manager = ShortcutManager::new();
    manager.update_shortcut(shortcut).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn reset_shortcuts_to_defaults() -> Result<(), String> {
    let mut manager = ShortcutManager::new();
    manager.reset_to_defaults();
    Ok(())
}
