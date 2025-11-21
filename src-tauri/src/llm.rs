use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use reqwest::Client;
use tauri::Window;
use futures::StreamExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMModel {
    pub name: String,
    pub size: String,
    pub installed: bool,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMStatus {
    pub ollama_running: bool,
    pub ollama_version: Option<String>,
    pub available_models: Vec<LLMModel>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationRequest {
    pub model: String,
    pub prompt: String,
    pub system_prompt: Option<String>,
    pub temperature: f32,
    pub max_tokens: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationResponse {
    pub text: String,
    pub model: String,
    pub tokens_used: usize,
}

pub struct LLMClient {
    client: Client,
    base_url: String,
}

impl LLMClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            base_url: "http://localhost:11434".to_string(), // Ollama default
        }
    }
    
    pub async fn check_status(&self) -> Result<LLMStatus> {
        // Check if Ollama is running
        let version_response = self.client
            .get(&format!("{}/api/version", self.base_url))
            .send()
            .await;
        
        let ollama_running = version_response.is_ok();
        let ollama_version = if ollama_running {
            Some("0.1.17".to_string()) // TODO: Parse from response
        } else {
            None
        };
        
        // Get available models
        let available_models = if ollama_running {
            self.list_models().await.unwrap_or_default()
        } else {
            self.get_recommended_models()
        };
        
        Ok(LLMStatus {
            ollama_running,
            ollama_version,
            available_models,
        })
    }
    
    async fn list_models(&self) -> Result<Vec<LLMModel>> {
        #[derive(Deserialize)]
        struct ModelInfo {
            name: String,
            size: i64,
        }
        
        #[derive(Deserialize)]
        struct TagsResponse {
            models: Vec<ModelInfo>,
        }
        
        let response = self.client
            .get(&format!("{}/api/tags", self.base_url))
            .send()
            .await?;
        
        let tags: TagsResponse = response.json().await?;
        
        Ok(tags.models.into_iter().map(|m| {
            LLMModel {
                name: m.name.clone(),
                size: format!("{:.1} GB", m.size as f64 / 1e9),
                installed: true,
                description: self.get_model_description(&m.name),
            }
        }).collect())
    }
    
    fn get_recommended_models(&self) -> Vec<LLMModel> {
        vec![
            LLMModel {
                name: "deepseek-coder-v2:33b".to_string(),
                size: "18.5 GB".to_string(),
                installed: false,
                description: "Best for production-quality code generation (Recommended)".to_string(),
            },
            LLMModel {
                name: "qwen2.5-coder:32b".to_string(),
                size: "17.8 GB".to_string(),
                installed: false,
                description: "Excellent multilingual support and reasoning".to_string(),
            },
            LLMModel {
                name: "starcoder2:15b".to_string(),
                size: "8.3 GB".to_string(),
                installed: false,
                description: "Lightweight option for older hardware".to_string(),
            },
        ]
    }
    
    fn get_model_description(&self, name: &str) -> String {
        if name.contains("deepseek-coder") {
            "Excellent for code generation with large context window".to_string()
        } else if name.contains("qwen") {
            "Great multilingual support and reasoning".to_string()
        } else if name.contains("starcoder") {
            "Fast and efficient code completion".to_string()
        } else {
            "AI coding model".to_string()
        }
    }
    
    pub async fn generate(&self, request: GenerationRequest) -> Result<GenerationResponse> {
        #[derive(Serialize)]
        struct OllamaRequest {
            model: String,
            prompt: String,
            stream: bool,
            options: OllamaOptions,
        }
        
        #[derive(Serialize)]
        struct OllamaOptions {
            temperature: f32,
            num_predict: usize,
        }
        
        #[derive(Deserialize)]
        struct OllamaResponse {
            response: String,
            model: String,
        }
        
        let full_prompt = if let Some(system) = request.system_prompt {
            format!("{}\n\n{}", system, request.prompt)
        } else {
            request.prompt.clone()
        };
        
        let ollama_request = OllamaRequest {
            model: request.model.clone(),
            prompt: full_prompt,
            stream: false,
            options: OllamaOptions {
                temperature: request.temperature,
                num_predict: request.max_tokens,
            },
        };
        
        let response = self.client
            .post(&format!("{}/api/generate", self.base_url))
            .json(&ollama_request)
            .send()
            .await
            .context("Failed to send request to Ollama")?;
        
        let ollama_response: OllamaResponse = response.json().await?;
        
        Ok(GenerationResponse {
            text: ollama_response.response,
            model: ollama_response.model,
            tokens_used: 0, // TODO: Calculate from response
        })
    }
    
    pub async fn generate_stream(
        &self,
        request: GenerationRequest,
        window: Window,
        request_id: String,
    ) -> Result<()> {
        #[derive(Serialize)]
        struct OllamaRequest {
            model: String,
            prompt: String,
            stream: bool,
            options: OllamaOptions,
        }
        
        #[derive(Serialize)]
        struct OllamaOptions {
            temperature: f32,
            num_predict: usize,
        }
        
        #[derive(Deserialize)]
        struct OllamaStreamChunk {
            response: String,
            done: bool,
            model: String,
        }
        
        let full_prompt = if let Some(system) = request.system_prompt {
            format!("{}\n\n{}", system, request.prompt)
        } else {
            request.prompt.clone()
        };
        
        let ollama_request = OllamaRequest {
            model: request.model.clone(),
            prompt: full_prompt,
            stream: true,
            options: OllamaOptions {
                temperature: request.temperature,
                num_predict: request.max_tokens,
            },
        };
        
        // Emit start event
        window.emit("llm-stream-start", &request_id)
            .context("Failed to emit start event")?;
        
        let response = self.client
            .post(&format!("{}/api/generate", self.base_url))
            .json(&ollama_request)
            .send()
            .await
            .context("Failed to send request to Ollama")?;
        
        if !response.status().is_success() {
            let error_msg = format!("Ollama returned error: {}", response.status());
            window.emit("llm-stream-error", (&request_id, &error_msg)).ok();
            return Err(anyhow::anyhow!(error_msg));
        }
        
        let mut stream = response.bytes_stream();
        let mut full_response = String::new();
        
        while let Some(chunk_result) = stream.next().await {
            let chunk = chunk_result.context("Stream error")?;
            let text = String::from_utf8_lossy(&chunk);
            
            for line in text.lines() {
                if line.is_empty() {
                    continue;
                }
                
                match serde_json::from_str::<OllamaStreamChunk>(line) {
                    Ok(data) => {
                        full_response.push_str(&data.response);
                        
                        // Emit chunk to frontend
                        window.emit("llm-stream-chunk", (&request_id, &data.response))
                            .context("Failed to emit chunk")?;
                        
                        if data.done {
                            // Emit completion
                            window.emit("llm-stream-done", (&request_id, &full_response))
                                .context("Failed to emit completion")?;
                            return Ok(());
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to parse chunk: {}", e);
                    }
                }
            }
        }
        
        Ok(())
    }
    
    pub async fn pull_model(&self, model_name: String, window: Window) -> Result<()> {
        #[derive(Serialize)]
        struct PullRequest {
            name: String,
            stream: bool,
        }
        
        #[derive(Deserialize)]
        struct PullProgress {
            status: String,
            #[serde(default)]
            total: i64,
            #[serde(default)]
            completed: i64,
        }
        
        let request = PullRequest {
            name: model_name.clone(),
            stream: true,
        };
        
        let response = self.client
            .post(&format!("{}/api/pull", self.base_url))
            .json(&request)
            .send()
            .await
            .context("Failed to pull model")?;
        
        let mut stream = response.bytes_stream();
        
        while let Some(chunk_result) = stream.next().await {
            let chunk = chunk_result.context("Stream error")?;
            let text = String::from_utf8_lossy(&chunk);
            
            for line in text.lines() {
                if line.is_empty() {
                    continue;
                }
                
                match serde_json::from_str::<PullProgress>(line) {
                    Ok(progress) => {
                        let progress_percent = if progress.total > 0 {
                            ((progress.completed as f64 / progress.total as f64) * 100.0) as i32
                        } else {
                            0
                        };
                        
                        window.emit("model-pull-progress", (&model_name, &progress.status, progress_percent)).ok();
                    }
                    Err(e) => {
                        eprintln!("Failed to parse pull progress: {}", e);
                    }
                }
            }
        }
        
        window.emit("model-pull-complete", &model_name).ok();
        Ok(())
    }
}

// Tauri commands

#[tauri::command]
pub async fn check_llm_status() -> Result<LLMStatus, String> {
    let client = LLMClient::new();
    client.check_status()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_available_models() -> Result<Vec<LLMModel>, String> {
    let client = LLMClient::new();
    client.list_models()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_code(request: GenerationRequest) -> Result<GenerationResponse, String> {
    let client = LLMClient::new();
    client.generate(request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_code_stream(
    window: Window,
    request: GenerationRequest,
    request_id: String,
) -> Result<(), String> {
    let client = LLMClient::new();
    client.generate_stream(request, window, request_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pull_model(window: Window, model_name: String) -> Result<(), String> {
    let client = LLMClient::new();
    client.pull_model(model_name, window)
        .await
        .map_err(|e| e.to_string())
}
