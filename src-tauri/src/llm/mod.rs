pub mod ollama;
pub mod client;
pub mod gemini;

pub use ollama::OllamaClient;
pub use gemini::GeminiClient;
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
        "gemma2:2b".to_string(),
        "llama3.2:3b".to_string(),
        "deepseek-r1:8b".to_string(),
        "gemini-1.5-pro".to_string(),
        "gemini-1.5-flash".to_string(),
    ])
}

#[tauri::command]
pub async fn generate_code(prompt: String) -> Result<String, String> {
    let client = LLMClient::new();
    let request = GenerationRequest {
        model: "llama3.2:3b".to_string(),
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
        model: "llama3.2:3b".to_string(),
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

#[tauri::command]
pub async fn generate_llm_response(
    prompt: String,
    system_prompt: Option<String>,
    provider: Option<String>,
    model: Option<String>,
) -> Result<String, String> {
    tracing::info!("Received LLM generation request. Prompt length: {}", prompt.len());
    
    use crate::preferences::{PreferencesManager, CloudProvider};
    
    // Load preferences
    let prefs_manager = PreferencesManager::new().map_err(|e| {
        tracing::error!("Failed to create PreferencesManager: {}", e);
        e.to_string()
    })?;
    
    let prefs = prefs_manager.load().map_err(|e| {
        tracing::error!("Failed to load preferences: {}", e);
        e.to_string()
    })?;
    
    // Determine provider and model
    let use_provider = if let Some(p) = provider {
        match p.to_lowercase().as_str() {
            "gemini" => CloudProvider::Gemini,
            "ollama" | "local" => CloudProvider::Ollama,
            _ => prefs.llm.cloud_provider,
        }
    } else {
        prefs.llm.cloud_provider
    };

    let use_model = model.unwrap_or(prefs.llm.default_model);

    tracing::info!("Using Provider: {:?}, Model: {}", use_provider, use_model);

    match use_provider {
        CloudProvider::Ollama => {
            let client = LLMClient::with_url(prefs.llm.base_url);
            let request = GenerationRequest {
                model: use_model,
                prompt,
                system_prompt,
                temperature: prefs.llm.temperature,
                max_tokens: prefs.llm.max_tokens,
            };
            
            match client.generate(request).await {
                Ok(response) => {
                    tracing::info!("Ollama generation successful. Response length: {}", response.text.len());
                    Ok(response.text)
                }
                Err(e) => {
                    tracing::error!("Ollama generation failed: {}", e);
                    Err(e.to_string())
                }
            }
        }
        CloudProvider::Gemini => {
            if prefs.llm.gemini_api_key.is_empty() {
                return Err("Gemini API Key is missing in preferences.".to_string());
            }
            let client = GeminiClient::new(prefs.llm.gemini_api_key);
            match client.generate(
                &use_model,
                &prompt,
                system_prompt.as_deref(),
                prefs.llm.temperature,
                prefs.llm.max_tokens
            ).await {
                Ok(text) => {
                    tracing::info!("Gemini generation successful. Response length: {}", text.len());
                    Ok(text)
                }
                Err(e) => {
                    tracing::error!("Gemini generation failed: {}", e);
                    Err(e.to_string())
                }
            }
        }
    }
}