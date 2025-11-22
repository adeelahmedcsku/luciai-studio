pub mod ollama;
pub mod client;

pub use ollama::OllamaClient;
pub use client::{LLMClient, GenerationRequest, GenerationResponse};

#[derive(Debug)]
pub enum LLMError {
    RequestFailed(String),
    ParseError(String),
    ConnectionError(String),
}

impl std::fmt::Display for LLMError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LLMError::RequestFailed(msg) => write!(f, "Request failed: {}", msg),
            LLMError::ParseError(msg) => write!(f, "Parse error: {}", msg),
            LLMError::ConnectionError(msg) => write!(f, "Connection error: {}", msg),
        }
    }
}

impl std::error::Error for LLMError {}

// Tauri commands
#[tauri::command]
pub fn check_llm_status() -> Result<bool, String> {
    Ok(true)
}

#[tauri::command]
pub async fn list_available_models() -> Result<Vec<String>, String> {
    Ok(vec![
        "deepseek-coder-v2:16b".to_string(),
        "mistral".to_string(),
        "neural-chat".to_string(),
    ])
}

#[tauri::command]
pub async fn generate_code(prompt: String) -> Result<String, String> {
    let client = LLMClient::new();
    let request = GenerationRequest {
        model: "deepseek-coder-v2:16b".to_string(),
        prompt,
        system_prompt: None,
        temperature: 0.5,
        max_tokens: 2048,
    };
    
    match client.generate(request).await {
        Ok(response) => Ok(response.text),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn generate_code_stream(prompt: String) -> Result<String, String> {
    let client = LLMClient::new();
    let request = GenerationRequest {
        model: "deepseek-coder-v2:16b".to_string(),
        prompt,
        system_prompt: None,
        temperature: 0.5,
        max_tokens: 2048,
    };
    
    match client.generate(request).await {
        Ok(response) => Ok(response.text),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn pull_model(model_name: String) -> Result<String, String> {
    Ok(format!("Model {} pulled successfully", model_name))
}