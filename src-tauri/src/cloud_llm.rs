use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use reqwest::Client;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudLLMConfig {
    pub id: String,
    pub name: String,
    pub provider: LLMProvider,
    pub endpoint: String,
    pub api_key: Option<String>,
    pub model_name: String,
    pub parameters: ModelParameters,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LLMProvider {
    Local,           // Ollama (default)
    SelfHosted,      // Custom server with large models (120B+)
    OpenAI,          // OpenAI API
    Anthropic,       // Claude API
    Custom,          // Custom endpoint
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelParameters {
    pub max_tokens: u32,
    pub temperature: f32,
    pub top_p: f32,
    pub frequency_penalty: f32,
    pub presence_penalty: f32,
    pub timeout_seconds: u64,
}

impl Default for ModelParameters {
    fn default() -> Self {
        Self {
            max_tokens: 4096,
            temperature: 0.7,
            top_p: 0.95,
            frequency_penalty: 0.0,
            presence_penalty: 0.0,
            timeout_seconds: 120,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudLLMRequest {
    pub model: String,
    pub messages: Vec<Message>,
    pub temperature: f32,
    pub max_tokens: u32,
    pub stream: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudLLMResponse {
    pub id: String,
    pub model: String,
    pub content: String,
    pub finish_reason: Option<String>,
    pub usage: Option<TokenUsage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsage {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
}

pub struct CloudLLMClient {
    client: Client,
}

impl CloudLLMClient {
    pub fn new() -> Self {
        Self {
            client: Client::builder()
                .timeout(Duration::from_secs(300)) // 5 min timeout for large models
                .build()
                .expect("Failed to create HTTP client"),
        }
    }
    
    /// Test connection to cloud LLM
    pub async fn test_connection(&self, config: &CloudLLMConfig) -> Result<bool> {
        match config.provider {
            LLMProvider::Local => {
                // Test Ollama connection
                let url = format!("{}/api/tags", config.endpoint);
                let response = self.client.get(&url)
                    .timeout(Duration::from_secs(5))
                    .send()
                    .await?;
                Ok(response.status().is_success())
            }
            LLMProvider::SelfHosted => {
                // Test custom server
                self.test_selfhosted_connection(config).await
            }
            LLMProvider::OpenAI => {
                self.test_openai_connection(config).await
            }
            LLMProvider::Anthropic => {
                self.test_anthropic_connection(config).await
            }
            LLMProvider::Custom => {
                self.test_custom_connection(config).await
            }
        }
    }
    
    /// Generate completion from cloud LLM
    pub async fn generate(
        &self,
        config: &CloudLLMConfig,
        prompt: String,
        system_prompt: Option<String>,
    ) -> Result<CloudLLMResponse> {
        match config.provider {
            LLMProvider::Local => {
                self.generate_local(config, prompt, system_prompt).await
            }
            LLMProvider::SelfHosted => {
                self.generate_selfhosted(config, prompt, system_prompt).await
            }
            LLMProvider::OpenAI => {
                self.generate_openai(config, prompt, system_prompt).await
            }
            LLMProvider::Anthropic => {
                self.generate_anthropic(config, prompt, system_prompt).await
            }
            LLMProvider::Custom => {
                self.generate_custom(config, prompt, system_prompt).await
            }
        }
    }
    
    /// Generate from self-hosted large model server (120B+)
    async fn generate_selfhosted(
        &self,
        config: &CloudLLMConfig,
        prompt: String,
        system_prompt: Option<String>,
    ) -> Result<CloudLLMResponse> {
        let mut messages = Vec::new();
        
        if let Some(sys) = system_prompt {
            messages.push(Message {
                role: "system".to_string(),
                content: sys,
            });
        }
        
        messages.push(Message {
            role: "user".to_string(),
            content: prompt,
        });
        
        // Support multiple self-hosted formats
        let payload = serde_json::json!({
            "model": config.model_name,
            "messages": messages,
            "temperature": config.parameters.temperature,
            "max_tokens": config.parameters.max_tokens,
            "top_p": config.parameters.top_p,
            "stream": false,
        });
        
        let mut request = self.client.post(&config.endpoint)
            .timeout(Duration::from_secs(config.parameters.timeout_seconds))
            .json(&payload);
        
        // Add auth if provided
        if let Some(api_key) = &config.api_key {
            request = request.bearer_auth(api_key);
        }
        
        let response = request.send().await?;
        
        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Self-hosted LLM error: {}", error_text);
        }
        
        let response_json: serde_json::Value = response.json().await?;
        
        // Parse response (supports OpenAI-compatible format)
        let content = response_json["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();
        
        let usage = if let Some(usage_data) = response_json.get("usage") {
            Some(TokenUsage {
                prompt_tokens: usage_data["prompt_tokens"].as_u64().unwrap_or(0) as u32,
                completion_tokens: usage_data["completion_tokens"].as_u64().unwrap_or(0) as u32,
                total_tokens: usage_data["total_tokens"].as_u64().unwrap_or(0) as u32,
            })
        } else {
            None
        };
        
        Ok(CloudLLMResponse {
            id: response_json["id"].as_str().unwrap_or("").to_string(),
            model: config.model_name.clone(),
            content,
            finish_reason: response_json["choices"][0]["finish_reason"]
                .as_str()
                .map(|s| s.to_string()),
            usage,
        })
    }
    
    /// Generate from local Ollama
    async fn generate_local(
        &self,
        config: &CloudLLMConfig,
        prompt: String,
        system_prompt: Option<String>,
    ) -> Result<CloudLLMResponse> {
        let url = format!("{}/api/generate", config.endpoint);
        
        let payload = serde_json::json!({
            "model": config.model_name,
            "prompt": prompt,
            "system": system_prompt,
            "temperature": config.parameters.temperature,
            "stream": false,
        });
        
        let response = self.client.post(&url)
            .timeout(Duration::from_secs(config.parameters.timeout_seconds))
            .json(&payload)
            .send()
            .await?;
        
        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Ollama error: {}", error_text);
        }
        
        let response_json: serde_json::Value = response.json().await?;
        
        Ok(CloudLLMResponse {
            id: uuid::Uuid::new_v4().to_string(),
            model: config.model_name.clone(),
            content: response_json["response"].as_str().unwrap_or("").to_string(),
            finish_reason: Some("stop".to_string()),
            usage: None,
        })
    }
    
    /// Generate from OpenAI
    async fn generate_openai(
        &self,
        config: &CloudLLMConfig,
        prompt: String,
        system_prompt: Option<String>,
    ) -> Result<CloudLLMResponse> {
        let api_key = config.api_key.as_ref()
            .context("OpenAI API key required")?;
        
        let mut messages = Vec::new();
        
        if let Some(sys) = system_prompt {
            messages.push(Message {
                role: "system".to_string(),
                content: sys,
            });
        }
        
        messages.push(Message {
            role: "user".to_string(),
            content: prompt,
        });
        
        let payload = serde_json::json!({
            "model": config.model_name,
            "messages": messages,
            "temperature": config.parameters.temperature,
            "max_tokens": config.parameters.max_tokens,
        });
        
        let response = self.client.post(&config.endpoint)
            .bearer_auth(api_key)
            .json(&payload)
            .send()
            .await?;
        
        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("OpenAI error: {}", error_text);
        }
        
        let response_json: serde_json::Value = response.json().await?;
        
        let content = response_json["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();
        
        let usage = response_json.get("usage").map(|u| TokenUsage {
            prompt_tokens: u["prompt_tokens"].as_u64().unwrap_or(0) as u32,
            completion_tokens: u["completion_tokens"].as_u64().unwrap_or(0) as u32,
            total_tokens: u["total_tokens"].as_u64().unwrap_or(0) as u32,
        });
        
        Ok(CloudLLMResponse {
            id: response_json["id"].as_str().unwrap_or("").to_string(),
            model: config.model_name.clone(),
            content,
            finish_reason: response_json["choices"][0]["finish_reason"]
                .as_str()
                .map(|s| s.to_string()),
            usage,
        })
    }
    
    /// Generate from Anthropic Claude
    async fn generate_anthropic(
        &self,
        config: &CloudLLMConfig,
        prompt: String,
        system_prompt: Option<String>,
    ) -> Result<CloudLLMResponse> {
        let api_key = config.api_key.as_ref()
            .context("Anthropic API key required")?;
        
        let mut messages = Vec::new();
        messages.push(Message {
            role: "user".to_string(),
            content: prompt,
        });
        
        let mut payload = serde_json::json!({
            "model": config.model_name,
            "messages": messages,
            "max_tokens": config.parameters.max_tokens,
        });
        
        if let Some(sys) = system_prompt {
            payload["system"] = serde_json::json!(sys);
        }
        
        let response = self.client.post(&config.endpoint)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&payload)
            .send()
            .await?;
        
        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Anthropic error: {}", error_text);
        }
        
        let response_json: serde_json::Value = response.json().await?;
        
        let content = response_json["content"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();
        
        let usage = response_json.get("usage").map(|u| TokenUsage {
            prompt_tokens: u["input_tokens"].as_u64().unwrap_or(0) as u32,
            completion_tokens: u["output_tokens"].as_u64().unwrap_or(0) as u32,
            total_tokens: (u["input_tokens"].as_u64().unwrap_or(0) + 
                          u["output_tokens"].as_u64().unwrap_or(0)) as u32,
        });
        
        Ok(CloudLLMResponse {
            id: response_json["id"].as_str().unwrap_or("").to_string(),
            model: config.model_name.clone(),
            content,
            finish_reason: response_json.get("stop_reason")
                .and_then(|s| s.as_str())
                .map(|s| s.to_string()),
            usage,
        })
    }
    
    /// Generate from custom endpoint
    async fn generate_custom(
        &self,
        config: &CloudLLMConfig,
        prompt: String,
        system_prompt: Option<String>,
    ) -> Result<CloudLLMResponse> {
        // Assume OpenAI-compatible format
        self.generate_selfhosted(config, prompt, system_prompt).await
    }
    
    // Test connection methods
    
    async fn test_selfhosted_connection(&self, config: &CloudLLMConfig) -> Result<bool> {
        let health_url = if config.endpoint.ends_with("/v1/chat/completions") {
            config.endpoint.replace("/v1/chat/completions", "/health")
        } else {
            format!("{}/health", config.endpoint)
        };
        
        let mut request = self.client.get(&health_url)
            .timeout(Duration::from_secs(10));
        
        if let Some(api_key) = &config.api_key {
            request = request.bearer_auth(api_key);
        }
        
        match request.send().await {
            Ok(response) => Ok(response.status().is_success()),
            Err(_) => {
                // Fallback: try a minimal generation request
                let test_result = self.generate_selfhosted(
                    config,
                    "test".to_string(),
                    None
                ).await;
                Ok(test_result.is_ok())
            }
        }
    }
    
    async fn test_openai_connection(&self, config: &CloudLLMConfig) -> Result<bool> {
        let api_key = config.api_key.as_ref()
            .context("OpenAI API key required")?;
        
        let url = format!("{}/models", config.endpoint.replace("/chat/completions", ""));
        
        let response = self.client.get(&url)
            .bearer_auth(api_key)
            .timeout(Duration::from_secs(10))
            .send()
            .await?;
        
        Ok(response.status().is_success())
    }
    
    async fn test_anthropic_connection(&self, config: &CloudLLMConfig) -> Result<bool> {
        let api_key = config.api_key.as_ref()
            .context("Anthropic API key required")?;
        
        // Try a minimal request
        let payload = serde_json::json!({
            "model": config.model_name,
            "messages": [{"role": "user", "content": "test"}],
            "max_tokens": 1,
        });
        
        let response = self.client.post(&config.endpoint)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&payload)
            .timeout(Duration::from_secs(10))
            .send()
            .await?;
        
        Ok(response.status().is_success())
    }
    
    async fn test_custom_connection(&self, config: &CloudLLMConfig) -> Result<bool> {
        self.test_selfhosted_connection(config).await
    }
}

// Configuration manager
pub struct CloudLLMConfigManager {
    configs: Vec<CloudLLMConfig>,
}

impl CloudLLMConfigManager {
    pub fn new() -> Self {
        let mut manager = Self {
            configs: Vec::new(),
        };
        manager.initialize_default_configs();
        manager
    }
    
    fn initialize_default_configs(&mut self) {
        // Default local Ollama config
        self.configs.push(CloudLLMConfig {
            id: "local-ollama".to_string(),
            name: "Local Ollama".to_string(),
            provider: LLMProvider::Local,
            endpoint: "http://localhost:11434".to_string(),
            api_key: None,
            model_name: "deepseek-coder-v2:16b".to_string(),
            parameters: ModelParameters::default(),
            enabled: true,
        });
    }
    
    pub fn add_config(&mut self, config: CloudLLMConfig) -> Result<()> {
        self.configs.push(config);
        Ok(())
    }
    
    pub fn get_config(&self, id: &str) -> Option<&CloudLLMConfig> {
        self.configs.iter().find(|c| c.id == id)
    }
    
    pub fn list_configs(&self) -> Vec<CloudLLMConfig> {
        self.configs.clone()
    }
    
    pub fn get_enabled_configs(&self) -> Vec<CloudLLMConfig> {
        self.configs.iter()
            .filter(|c| c.enabled)
            .cloned()
            .collect()
    }
}

// Tauri commands
#[tauri::command]
pub async fn add_cloud_llm_config(config: CloudLLMConfig) -> Result<(), String> {
    // TODO: Persist to preferences
    tracing::info!("Added cloud LLM config: {}", config.name);
    Ok(())
}

#[tauri::command]
pub async fn test_cloud_llm_connection(config: CloudLLMConfig) -> Result<bool, String> {
    let client = CloudLLMClient::new();
    client.test_connection(&config)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_with_cloud_llm(
    config: CloudLLMConfig,
    prompt: String,
    system_prompt: Option<String>,
) -> Result<CloudLLMResponse, String> {
    let client = CloudLLMClient::new();
    client.generate(&config, prompt, system_prompt)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_cloud_llm_configs() -> Result<Vec<CloudLLMConfig>, String> {
    let manager = CloudLLMConfigManager::new();
    Ok(manager.list_configs())
}
