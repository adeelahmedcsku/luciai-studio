use reqwest::Client;
use serde::{Deserialize, Serialize};
use anyhow::{Result, anyhow};

#[derive(Serialize, Deserialize, Debug)]
struct GeminiRequest {
    contents: Vec<Content>,
    generationConfig: GenerationConfig,
}

#[derive(Serialize, Deserialize, Debug)]
struct Content {
    role: String,
    parts: Vec<Part>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Part {
    text: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct GenerationConfig {
    temperature: f32,
    maxOutputTokens: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct GeminiResponse {
    candidates: Option<Vec<Candidate>>,
    error: Option<GeminiError>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Candidate {
    content: Content,
    finishReason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct GeminiError {
    code: i32,
    message: String,
    status: String,
}

#[derive(Clone)]
pub struct GeminiClient {
    api_key: String,
    client: Client,
}

impl GeminiClient {
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: Client::new(),
        }
    }

    pub async fn generate(
        &self,
        model: &str,
        prompt: &str,
        system_prompt: Option<&str>,
        temperature: f32,
        max_tokens: u32,
    ) -> Result<String> {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            model, self.api_key
        );

        tracing::info!("Sending request to Gemini model: {}", model);

        let mut contents = Vec::new();

        // Gemini doesn't have a separate "system" role in the same way as OpenAI/Ollama in the main content list usually,
        // but for simplicity we can prepend it or use the 'user' role. 
        // Newer Gemini API versions support system instructions, but let's stick to prepending for stability if needed.
        // Actually, let's just prepend the system prompt to the user prompt for now to be safe and simple.
        
        let final_prompt = if let Some(sys) = system_prompt {
            format!("System Instruction: {}\n\nUser Request: {}", sys, prompt)
        } else {
            prompt.to_string()
        };

        contents.push(Content {
            role: "user".to_string(),
            parts: vec![Part { text: final_prompt }],
        });

        let request_body = GeminiRequest {
            contents,
            generationConfig: GenerationConfig {
                temperature: temperature.clamp(0.0, 1.0),
                maxOutputTokens: max_tokens,
            },
        };

        let response = self.client
            .post(&url)
            .json(&request_body)
            .send()
            .await
            .map_err(|e| anyhow!("Failed to send request to Gemini: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            tracing::error!("Gemini API error: Status {}, Body: {}", status, text);
            return Err(anyhow!("Gemini API returned status {}: {}", status, text));
        }

        let gemini_response: GeminiResponse = response
            .json()
            .await
            .map_err(|e| anyhow!("Failed to parse Gemini response: {}", e))?;

        if let Some(error) = gemini_response.error {
            return Err(anyhow!("Gemini API Error {}: {}", error.code, error.message));
        }

        if let Some(candidates) = gemini_response.candidates {
            if let Some(first_candidate) = candidates.first() {
                if let Some(first_part) = first_candidate.content.parts.first() {
                    return Ok(first_part.text.clone());
                }
            }
        }

        Err(anyhow!("No content generated from Gemini"))
    }
}
