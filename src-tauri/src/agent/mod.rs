pub mod pipeline;
pub mod test_generator;
pub mod validator;
pub mod deployment;
pub mod refactorer;

use serde::{Deserialize, Serialize};
use anyhow::Result;

use crate::llm::{LLMClient, GenerationRequest};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessage {
    pub id: String,
    pub role: String, // "user" or "assistant"
    pub content: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentHistory {
    pub messages: Vec<AgentMessage>,
}

// Global agent history storage
use std::sync::Mutex;

static AGENT_HISTORY: Mutex<Option<AgentHistory>> = Mutex::new(None);

fn get_history() -> AgentHistory {
    let mut history = AGENT_HISTORY.lock().unwrap();
    if history.is_none() {
        *history = Some(AgentHistory {
            messages: Vec::new(),
        });
    }
    history.as_ref().unwrap().clone()
}

fn add_message(message: AgentMessage) {
    let mut history = AGENT_HISTORY.lock().unwrap();
    if history.is_none() {
        *history = Some(AgentHistory {
            messages: Vec::new(),
        });
    }
    if let Some(ref mut h) = *history {
        h.messages.push(message);
    }
}

#[tauri::command]
pub async fn send_prompt(prompt: String) -> Result<String, String> {
    let client = LLMClient::new();
    
    // Add user message to history
    add_message(AgentMessage {
        id: uuid::Uuid::new_v4().to_string(),
        role: "user".to_string(),
        content: prompt.clone(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    });
    
    let request = GenerationRequest {
        model: "deepseek-r1:8b".to_string(),
        prompt: prompt.clone(),
        system_prompt: Some("You are a helpful AI coding assistant.".to_string()),
        temperature: 0.7,
        max_tokens: 2048,
    };
    
    match client.generate(request).await {
        Ok(response) => {
            // Add assistant message to history
            add_message(AgentMessage {
                id: uuid::Uuid::new_v4().to_string(),
                role: "assistant".to_string(),
                content: response.text.clone(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            });
            
            Ok(response.text)
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn get_agent_history() -> Result<AgentHistory, String> {
    Ok(get_history())
}