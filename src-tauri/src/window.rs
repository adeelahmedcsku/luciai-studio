use tauri::{command, AppHandle, Manager, Window};

#[command]
pub async fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| format!("Failed to minimize: {}", e))
}

#[command]
pub async fn toggle_maximize(window: Window) -> Result<(), String> {
    if window.is_maximized().map_err(|e| format!("Failed to check maximized state: {}", e))? {
        window.unmaximize().map_err(|e| format!("Failed to unmaximize: {}", e))
    } else {
        window.maximize().map_err(|e| format!("Failed to maximize: {}", e))
    }
}

#[command]
pub async fn close_window(window: Window) -> Result<(), String> {
    window.close().map_err(|e| format!("Failed to close: {}", e))
}

#[command]
pub async fn is_maximized(window: Window) -> Result<bool, String> {
    window.is_maximized().map_err(|e| format!("Failed to check maximized state: {}", e))
}
