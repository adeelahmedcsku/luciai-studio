use serde::{Deserialize, Serialize};
use crate::llm::ollama::OllamaClient;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationRequest {
    pub model: String,
    pub prompt: String,
    pub system_prompt: Option<String>,
    pub temperature: f32,
    pub max_tokens: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationResponse {
    pub text: String,
    pub model: String,
    pub stop_reason: String,
}

#[derive(Clone)]
pub struct LLMClient {
    ollama: OllamaClient,
}

impl LLMClient {
    pub fn new() -> Self {
        Self {
            ollama: OllamaClient::new("http://localhost:11434".to_string()),
        }
    }

    pub fn with_url(url: String) -> Self {
        Self {
            ollama: OllamaClient::new(url),
        }
    }

    pub async fn generate(&self, request: GenerationRequest) -> anyhow::Result<GenerationResponse> {
        let full_prompt = if let Some(system) = &request.system_prompt {
            format!("{}\n\n{}", system, request.prompt)
        } else {
            request.prompt.clone()
        };

        let response_text = self.ollama.generate(
            &request.model,
            &full_prompt,
            request.temperature,
            request.max_tokens,
        ).await?;

        Ok(GenerationResponse {
            text: response_text,
            model: request.model,
            stop_reason: "stop".to_string(),
        })
    }
}

impl Default for LLMClient {
    fn default() -> Self {
        Self::new()
    }
}