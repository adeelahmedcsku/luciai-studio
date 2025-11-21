use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::process::{Command, Stdio};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandRequest {
    pub command: String,
    pub args: Vec<String>,
    pub working_dir: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResponse {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub success: bool,
}

pub struct TerminalExecutor;

impl TerminalExecutor {
    pub fn new() -> Self {
        Self
    }
    
    pub fn execute(&self, request: CommandRequest) -> Result<CommandResponse> {
        let mut cmd = if cfg!(target_os = "windows") {
            let mut c = Command::new("cmd");
            c.args(&["/C", &request.command]);
            c
        } else {
            let mut c = Command::new("sh");
            c.args(&["-c", &request.command]);
            c
        };
        
        // Set working directory if provided
        if let Some(dir) = request.working_dir {
            cmd.current_dir(dir);
        }
        
        // Execute command
        let output = cmd
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()?;
        
        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let exit_code = output.status.code().unwrap_or(-1);
        
        Ok(CommandResponse {
            stdout,
            stderr,
            exit_code,
            success: output.status.success(),
        })
    }
}

// Tauri commands

#[tauri::command]
pub async fn execute_command(request: CommandRequest) -> Result<CommandResponse, String> {
    let executor = TerminalExecutor::new();
    executor.execute(request)
        .map_err(|e| e.to_string())
}
