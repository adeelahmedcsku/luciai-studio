use reqwest::Client;
use serde::{Deserialize, Serialize};
use anyhow::{Result, anyhow};

#[derive(Serialize, Deserialize, Debug)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
    temperature: f32,
    num_predict: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct OllamaResponse {
    response: String,
    model: String,
    done: bool,
}

#[derive(Clone)]
pub struct OllamaClient {
    base_url: String,
    client: Client,
}

impl OllamaClient {
    pub fn new(base_url: String) -> Self {
        Self {
            base_url,
            client: Client::new(),
        }
    }

    pub async fn generate(
        &self,
        model: &str,
        prompt: &str,
        temperature: f32,
        max_tokens: u32,
    ) -> Result<String> {
        let request = OllamaRequest {
            model: model.to_string(),
            prompt: prompt.to_string(),
            stream: false,
            temperature: temperature.clamp(0.0, 1.0),
            num_predict: max_tokens,
        };

        let response = self
            .client
            .post(&format!("{}/api/generate", self.base_url))
            .json(&request)
            .send()
            .await
            .map_err(|e| anyhow!("Failed to send request to Ollama: {}", e))?;

        if !response.status().is_success() {
            return Err(anyhow!(
                "Ollama returned status {}: {}",
                response.status(),
                response.text().await.unwrap_or_default()
            ));
        }

        let ollama_response: OllamaResponse = response
            .json()
            .await
            .map_err(|e| anyhow!("Failed to parse Ollama response: {}", e))?;

        Ok(ollama_response.response.trim().to_string())
    }

    pub async fn list_models(&self) -> Result<Vec<String>> {
        #[derive(Serialize, Deserialize, Debug)]
        struct ModelsResponse {
            models: Vec<ModelInfo>,
        }

        #[derive(Serialize, Deserialize, Debug)]
        struct ModelInfo {
            name: String,
        }

        let response = self
            .client
            .get(&format!("{}/api/tags", self.base_url))
            .send()
            .await
            .map_err(|e| anyhow!("Failed to list models: {}", e))?;

        let models_response: ModelsResponse = response
            .json()
            .await
            .map_err(|e| anyhow!("Failed to parse models response: {}", e))?;

        Ok(models_response
            .models
            .into_iter()
            .map(|m| m.name)
            .collect())
    }

    pub async fn is_available(&self) -> bool {
        self.client
            .get(&format!("{}/api/tags", self.base_url))
            .send()
            .await
            .is_ok()
    }
}