use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::collections::VecDeque;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    pub id: String,
    pub title: String,
    pub message: String,
    pub level: NotificationLevel,
    pub category: NotificationCategory,
    pub timestamp: String,
    pub read: bool,
    pub actions: Vec<NotificationAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NotificationLevel {
    Info,
    Success,
    Warning,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NotificationCategory {
    System,
    Project,
    Git,
    LLM,
    Update,
    Plugin,
    License,
    Test,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationAction {
    pub label: String,
    pub action: String,
}

pub struct NotificationManager {
    notifications: VecDeque<Notification>,
    max_notifications: usize,
}

impl NotificationManager {
    pub fn new() -> Self {
        Self {
            notifications: VecDeque::new(),
            max_notifications: 100,
        }
    }
    
    pub fn add(&mut self, notification: Notification) {
        // Add to front
        self.notifications.push_front(notification);
        
        // Keep only max
        while self.notifications.len() > self.max_notifications {
            self.notifications.pop_back();
        }
    }
    
    pub fn get_all(&self) -> Vec<Notification> {
        self.notifications.iter().cloned().collect()
    }
    
    pub fn get_unread(&self) -> Vec<Notification> {
        self.notifications.iter()
            .filter(|n| !n.read)
            .cloned()
            .collect()
    }
    
    pub fn mark_read(&mut self, id: &str) -> Result<()> {
        if let Some(notification) = self.notifications.iter_mut().find(|n| n.id == id) {
            notification.read = true;
        }
        Ok(())
    }
    
    pub fn mark_all_read(&mut self) {
        for notification in &mut self.notifications {
            notification.read = true;
        }
    }
    
    pub fn delete(&mut self, id: &str) {
        self.notifications.retain(|n| n.id != id);
    }
    
    pub fn clear_all(&mut self) {
        self.notifications.clear();
    }
    
    pub fn clear_read(&mut self) {
        self.notifications.retain(|n| !n.read);
    }
    
    // Helper methods to create common notifications
    
    pub fn notify_success(&mut self, title: &str, message: &str, category: NotificationCategory) {
        self.add(Notification {
            id: uuid::Uuid::new_v4().to_string(),
            title: title.to_string(),
            message: message.to_string(),
            level: NotificationLevel::Success,
            category,
            timestamp: chrono::Utc::now().to_rfc3339(),
            read: false,
            actions: vec![],
        });
    }
    
    pub fn notify_error(&mut self, title: &str, message: &str, category: NotificationCategory) {
        self.add(Notification {
            id: uuid::Uuid::new_v4().to_string(),
            title: title.to_string(),
            message: message.to_string(),
            level: NotificationLevel::Error,
            category,
            timestamp: chrono::Utc::now().to_rfc3339(),
            read: false,
            actions: vec![],
        });
    }
    
    pub fn notify_warning(&mut self, title: &str, message: &str, category: NotificationCategory) {
        self.add(Notification {
            id: uuid::Uuid::new_v4().to_string(),
            title: title.to_string(),
            message: message.to_string(),
            level: NotificationLevel::Warning,
            category,
            timestamp: chrono::Utc::now().to_rfc3339(),
            read: false,
            actions: vec![],
        });
    }
    
    pub fn notify_info(&mut self, title: &str, message: &str, category: NotificationCategory) {
        self.add(Notification {
            id: uuid::Uuid::new_v4().to_string(),
            title: title.to_string(),
            message: message.to_string(),
            level: NotificationLevel::Info,
            category,
            timestamp: chrono::Utc::now().to_rfc3339(),
            read: false,
            actions: vec![],
        });
    }
}

// Global notification manager
static mut NOTIFICATION_MANAGER: Option<NotificationManager> = None;

fn get_manager() -> &'static mut NotificationManager {
    unsafe {
        if NOTIFICATION_MANAGER.is_none() {
            NOTIFICATION_MANAGER = Some(NotificationManager::new());
        }
        NOTIFICATION_MANAGER.as_mut().unwrap()
    }
}

// Tauri commands

#[tauri::command]
pub async fn add_notification(notification: Notification) -> Result<(), String> {
    get_manager().add(notification);
    Ok(())
}

#[tauri::command]
pub async fn get_all_notifications() -> Result<Vec<Notification>, String> {
    Ok(get_manager().get_all())
}

#[tauri::command]
pub async fn get_unread_notifications() -> Result<Vec<Notification>, String> {
    Ok(get_manager().get_unread())
}

#[tauri::command]
pub async fn mark_notification_read(id: String) -> Result<(), String> {
    get_manager().mark_read(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn mark_all_notifications_read() -> Result<(), String> {
    get_manager().mark_all_read();
    Ok(())
}

#[tauri::command]
pub async fn delete_notification(id: String) -> Result<(), String> {
    get_manager().delete(&id);
    Ok(())
}

#[tauri::command]
pub async fn clear_all_notifications() -> Result<(), String> {
    get_manager().clear_all();
    Ok(())
}

#[tauri::command]
pub async fn clear_read_notifications() -> Result<(), String> {
    get_manager().clear_read();
    Ok(())
}

#[tauri::command]
pub async fn notify_success_msg(
    title: String,
    message: String,
    category: String,
) -> Result<(), String> {
    let cat = match category.as_str() {
        "System" => NotificationCategory::System,
        "Project" => NotificationCategory::Project,
        "Git" => NotificationCategory::Git,
        "LLM" => NotificationCategory::LLM,
        "Update" => NotificationCategory::Update,
        "Plugin" => NotificationCategory::Plugin,
        "License" => NotificationCategory::License,
        "Test" => NotificationCategory::Test,
        _ => NotificationCategory::System,
    };
    
    get_manager().notify_success(&title, &message, cat);
    Ok(())
}

#[tauri::command]
pub async fn notify_error_msg(
    title: String,
    message: String,
    category: String,
) -> Result<(), String> {
    let cat = match category.as_str() {
        "System" => NotificationCategory::System,
        "Project" => NotificationCategory::Project,
        "Git" => NotificationCategory::Git,
        "LLM" => NotificationCategory::LLM,
        "Update" => NotificationCategory::Update,
        "Plugin" => NotificationCategory::Plugin,
        "License" => NotificationCategory::License,
        "Test" => NotificationCategory::Test,
        _ => NotificationCategory::System,
    };
    
    get_manager().notify_error(&title, &message, cat);
    Ok(())
}

#[tauri::command]
pub async fn notify_warning_msg(
    title: String,
    message: String,
    category: String,
) -> Result<(), String> {
    let cat = match category.as_str() {
        "System" => NotificationCategory::System,
        "Project" => NotificationCategory::Project,
        "Git" => NotificationCategory::Git,
        "LLM" => NotificationCategory::LLM,
        "Update" => NotificationCategory::Update,
        "Plugin" => NotificationCategory::Plugin,
        "License" => NotificationCategory::License,
        "Test" => NotificationCategory::Test,
        _ => NotificationCategory::System,
    };
    
    get_manager().notify_warning(&title, &message, cat);
    Ok(())
}

#[tauri::command]
pub async fn notify_info_msg(
    title: String,
    message: String,
    category: String,
) -> Result<(), String> {
    let cat = match category.as_str() {
        "System" => NotificationCategory::System,
        "Project" => NotificationCategory::Project,
        "Git" => NotificationCategory::Git,
        "LLM" => NotificationCategory::LLM,
        "Update" => NotificationCategory::Update,
        "Plugin" => NotificationCategory::Plugin,
        "License" => NotificationCategory::License,
        "Test" => NotificationCategory::Test,
        _ => NotificationCategory::System,
    };
    
    get_manager().notify_info(&title, &message, cat);
    Ok(())
}
