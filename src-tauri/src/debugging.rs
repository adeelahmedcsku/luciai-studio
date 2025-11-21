use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Breakpoint {
    pub id: String,
    pub file_path: String,
    pub line: u32,
    pub condition: Option<String>,
    pub enabled: bool,
    pub hit_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugSession {
    pub id: String,
    pub project_id: String,
    pub language: String,
    pub status: DebugStatus,
    pub breakpoints: Vec<Breakpoint>,
    pub current_frame: Option<StackFrame>,
    pub variables: HashMap<String, VariableValue>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DebugStatus {
    Idle,
    Running,
    Paused,
    Stopped,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackFrame {
    pub id: u32,
    pub name: String,
    pub file: String,
    pub line: u32,
    pub column: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariableValue {
    pub name: String,
    pub value: String,
    pub type_name: String,
    pub children: Vec<VariableValue>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugConfiguration {
    pub name: String,
    pub type_: String,
    pub request: String,
    pub program: String,
    pub args: Vec<String>,
    pub cwd: String,
    pub env: HashMap<String, String>,
}

pub struct DebugManager {
    sessions: HashMap<String, DebugSession>,
    configurations: Vec<DebugConfiguration>,
}

impl DebugManager {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
            configurations: Vec::new(),
        }
    }
    
    // Breakpoint Management
    
    pub fn add_breakpoint(&mut self, session_id: &str, breakpoint: Breakpoint) -> Result<()> {
        if let Some(session) = self.sessions.get_mut(session_id) {
            session.breakpoints.push(breakpoint);
        }
        Ok(())
    }
    
    pub fn remove_breakpoint(&mut self, session_id: &str, breakpoint_id: &str) -> Result<()> {
        if let Some(session) = self.sessions.get_mut(session_id) {
            session.breakpoints.retain(|bp| bp.id != breakpoint_id);
        }
        Ok(())
    }
    
    pub fn toggle_breakpoint(&mut self, session_id: &str, breakpoint_id: &str) -> Result<()> {
        if let Some(session) = self.sessions.get_mut(session_id) {
            if let Some(bp) = session.breakpoints.iter_mut().find(|b| b.id == breakpoint_id) {
                bp.enabled = !bp.enabled;
            }
        }
        Ok(())
    }
    
    pub fn list_breakpoints(&self, session_id: &str) -> Vec<Breakpoint> {
        self.sessions
            .get(session_id)
            .map(|s| s.breakpoints.clone())
            .unwrap_or_default()
    }
    
    // Session Management
    
    pub fn create_session(&mut self, project_id: String, language: String) -> String {
        let session_id = uuid::Uuid::new_v4().to_string();
        let session = DebugSession {
            id: session_id.clone(),
            project_id,
            language,
            status: DebugStatus::Idle,
            breakpoints: Vec::new(),
            current_frame: None,
            variables: HashMap::new(),
        };
        self.sessions.insert(session_id.clone(), session);
        session_id
    }
    
    pub fn start_debugging(&mut self, session_id: &str) -> Result<()> {
        if let Some(session) = self.sessions.get_mut(session_id) {
            session.status = DebugStatus::Running;
        }
        Ok(())
    }
    
    pub fn pause_debugging(&mut self, session_id: &str) -> Result<()> {
        if let Some(session) = self.sessions.get_mut(session_id) {
            session.status = DebugStatus::Paused;
        }
        Ok(())
    }
    
    pub fn stop_debugging(&mut self, session_id: &str) -> Result<()> {
        if let Some(session) = self.sessions.get_mut(session_id) {
            session.status = DebugStatus::Stopped;
        }
        Ok(())
    }
    
    pub fn continue_debugging(&mut self, session_id: &str) -> Result<()> {
        if let Some(session) = self.sessions.get_mut(session_id) {
            session.status = DebugStatus::Running;
        }
        Ok(())
    }
    
    // Step Controls
    
    pub fn step_over(&mut self, session_id: &str) -> Result<()> {
        // Would interact with debugger adapter
        tracing::info!("Step over in session {}", session_id);
        Ok(())
    }
    
    pub fn step_into(&mut self, session_id: &str) -> Result<()> {
        tracing::info!("Step into in session {}", session_id);
        Ok(())
    }
    
    pub fn step_out(&mut self, session_id: &str) -> Result<()> {
        tracing::info!("Step out in session {}", session_id);
        Ok(())
    }
    
    // Variable Inspection
    
    pub fn get_variables(&self, session_id: &str) -> HashMap<String, VariableValue> {
        self.sessions
            .get(session_id)
            .map(|s| s.variables.clone())
            .unwrap_or_default()
    }
    
    pub fn evaluate_expression(&self, session_id: &str, expression: &str) -> Result<String> {
        // Would interact with debugger to evaluate
        tracing::info!("Evaluating '{}' in session {}", expression, session_id);
        Ok(format!("Result of: {}", expression))
    }
    
    // Configuration Management
    
    pub fn add_configuration(&mut self, config: DebugConfiguration) {
        self.configurations.push(config);
    }
    
    pub fn get_configurations(&self) -> Vec<DebugConfiguration> {
        self.configurations.clone()
    }
    
    pub fn load_configurations(&mut self, project_path: &PathBuf) -> Result<()> {
        let launch_json = project_path.join(".vscode").join("launch.json");
        if launch_json.exists() {
            let content = std::fs::read_to_string(launch_json)?;
            let configs: serde_json::Value = serde_json::from_str(&content)?;
            
            if let Some(configurations) = configs.get("configurations").and_then(|c| c.as_array()) {
                for config in configurations {
                    if let Ok(debug_config) = serde_json::from_value::<DebugConfiguration>(config.clone()) {
                        self.add_configuration(debug_config);
                    }
                }
            }
        }
        Ok(())
    }
    
    pub fn create_default_configurations(&self, language: &str) -> Vec<DebugConfiguration> {
        match language {
            "rust" => vec![
                DebugConfiguration {
                    name: "Debug Rust".to_string(),
                    type_: "lldb".to_string(),
                    request: "launch".to_string(),
                    program: "${workspaceFolder}/target/debug/${workspaceFolderBasename}".to_string(),
                    args: vec![],
                    cwd: "${workspaceFolder}".to_string(),
                    env: HashMap::new(),
                }
            ],
            "javascript" | "typescript" => vec![
                DebugConfiguration {
                    name: "Debug Node".to_string(),
                    type_: "node".to_string(),
                    request: "launch".to_string(),
                    program: "${workspaceFolder}/index.js".to_string(),
                    args: vec![],
                    cwd: "${workspaceFolder}".to_string(),
                    env: HashMap::new(),
                }
            ],
            "python" => vec![
                DebugConfiguration {
                    name: "Debug Python".to_string(),
                    type_: "python".to_string(),
                    request: "launch".to_string(),
                    program: "${file}".to_string(),
                    args: vec![],
                    cwd: "${workspaceFolder}".to_string(),
                    env: HashMap::new(),
                }
            ],
            _ => vec![],
        }
    }
}

// Global instance
static mut DEBUG_MANAGER: Option<DebugManager> = None;

fn get_debug_manager() -> &'static mut DebugManager {
    unsafe {
        if DEBUG_MANAGER.is_none() {
            DEBUG_MANAGER = Some(DebugManager::new());
        }
        DEBUG_MANAGER.as_mut().unwrap()
    }
}

// Tauri commands

#[tauri::command]
pub async fn create_debug_session(project_id: String, language: String) -> Result<String, String> {
    let session_id = get_debug_manager().create_session(project_id, language);
    Ok(session_id)
}

#[tauri::command]
pub async fn start_debug(session_id: String) -> Result<(), String> {
    get_debug_manager().start_debugging(&session_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pause_debug(session_id: String) -> Result<(), String> {
    get_debug_manager().pause_debugging(&session_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn stop_debug(session_id: String) -> Result<(), String> {
    get_debug_manager().stop_debugging(&session_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn continue_debug(session_id: String) -> Result<(), String> {
    get_debug_manager().continue_debugging(&session_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn debug_step_over(session_id: String) -> Result<(), String> {
    get_debug_manager().step_over(&session_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn debug_step_into(session_id: String) -> Result<(), String> {
    get_debug_manager().step_into(&session_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn debug_step_out(session_id: String) -> Result<(), String> {
    get_debug_manager().step_out(&session_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_debug_breakpoint(session_id: String, breakpoint: Breakpoint) -> Result<(), String> {
    get_debug_manager().add_breakpoint(&session_id, breakpoint).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_debug_breakpoint(session_id: String, breakpoint_id: String) -> Result<(), String> {
    get_debug_manager().remove_breakpoint(&session_id, &breakpoint_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn toggle_debug_breakpoint(session_id: String, breakpoint_id: String) -> Result<(), String> {
    get_debug_manager().toggle_breakpoint(&session_id, &breakpoint_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_debug_breakpoints(session_id: String) -> Result<Vec<Breakpoint>, String> {
    Ok(get_debug_manager().list_breakpoints(&session_id))
}

#[tauri::command]
pub async fn get_debug_variables(session_id: String) -> Result<HashMap<String, VariableValue>, String> {
    Ok(get_debug_manager().get_variables(&session_id))
}

#[tauri::command]
pub async fn evaluate_debug_expression(session_id: String, expression: String) -> Result<String, String> {
    get_debug_manager().evaluate_expression(&session_id, &expression).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_debug_configurations() -> Result<Vec<DebugConfiguration>, String> {
    Ok(get_debug_manager().get_configurations())
}

#[tauri::command]
pub async fn add_debug_configuration(config: DebugConfiguration) -> Result<(), String> {
    get_debug_manager().add_configuration(config);
    Ok(())
}

#[tauri::command]
pub async fn get_default_debug_configs(language: String) -> Result<Vec<DebugConfiguration>, String> {
    Ok(get_debug_manager().create_default_configurations(&language))
}
