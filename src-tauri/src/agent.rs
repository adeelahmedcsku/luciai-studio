use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use anyhow::Result;

use crate::llm::{LLMClient, GenerationRequest};

pub mod pipeline;
pub mod test_generator;
pub mod validator;
pub mod deployment;
pub mod refactorer;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPrompt {
    pub project_id: String,
    pub user_message: String,
    pub context: AgentContext,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentContext {
    pub project_type: String,
    pub tech_stack: Vec<String>,
    pub existing_files: Vec<String>,
    pub previous_prompts: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentResponse {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub message: String,
    pub actions: Vec<AgentAction>,
    pub status: AgentStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentAction {
    CreateFile { path: String, content: String },
    ModifyFile { path: String, changes: String },
    DeleteFile { path: String },
    InstallDependency { package: String },
    GenerateDocumentation { file_path: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentStatus {
    Thinking,
    Planning,
    Generating,
    Complete,
    Error { message: String },
}

pub struct Agent {
    llm_client: LLMClient,
}

impl Agent {
    pub fn new() -> Self {
        Self {
            llm_client: LLMClient::new(),
        }
    }
    
    pub async fn process_prompt(&self, prompt: AgentPrompt) -> Result<AgentResponse> {
        let response_id = Uuid::new_v4().to_string();
        
        // Build system prompt
        let system_prompt = self.build_system_prompt(&prompt.context);
        
        // Build user prompt
        let user_prompt = self.build_user_prompt(&prompt);
        
        // Generate response from LLM
        let generation_request = GenerationRequest {
            model: "deepseek-coder-v2:33b".to_string(), // Default model
            prompt: user_prompt,
            system_prompt: Some(system_prompt),
            temperature: 0.7,
            max_tokens: 4096,
        };
        
        let llm_response = self.llm_client.generate(generation_request).await?;
        
        // Parse the response to extract actions
        let actions = self.parse_actions(&llm_response.text);
        
        Ok(AgentResponse {
            id: response_id,
            timestamp: Utc::now(),
            message: llm_response.text,
            actions,
            status: AgentStatus::Complete,
        })
    }
    
    fn build_system_prompt(&self, context: &AgentContext) -> String {
        format!(
            r#"You are an expert software development agent. You help developers create high-quality software projects.

Current Project Context:
- Type: {}
- Tech Stack: {}
- Existing Files: {}

Your responsibilities:
1. Understand user requirements clearly
2. Plan the implementation strategy
3. Generate production-quality code
4. Include error handling and best practices
5. Provide clear explanations

When generating code:
- Use modern best practices
- Include proper error handling
- Add helpful comments
- Follow the project's existing patterns
- Generate complete, working code

Response Format:
1. First, explain your understanding and plan
2. Then provide the code or actions needed
3. Finally, explain how to test or use what you created"#,
            context.project_type,
            context.tech_stack.join(", "),
            context.existing_files.len()
        )
    }
    
    fn build_user_prompt(&self, prompt: &AgentPrompt) -> String {
        let mut full_prompt = String::new();
        
        // Add previous context if available
        if !prompt.context.previous_prompts.is_empty() {
            full_prompt.push_str("Previous conversation:\n");
            for prev in &prompt.context.previous_prompts {
                full_prompt.push_str(&format!("- {}\n", prev));
            }
            full_prompt.push_str("\n");
        }
        
        // Add current request
        full_prompt.push_str("Current request:\n");
        full_prompt.push_str(&prompt.user_message);
        
        full_prompt
    }
    
    fn parse_actions(&self, response_text: &str) -> Vec<AgentAction> {
        // TODO: Implement sophisticated action parsing
        // For now, return empty vec - will be implemented in next session
        Vec::new()
    }
    
    pub fn get_history(&self, project_id: &str) -> Result<Vec<AgentResponse>> {
        // TODO: Load from project metadata
        Ok(Vec::new())
    }
}

// Tauri commands

#[tauri::command]
pub async fn send_prompt(prompt: AgentPrompt) -> Result<AgentResponse, String> {
    let agent = Agent::new();
    agent.process_prompt(prompt)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_agent_history(project_id: String) -> Result<Vec<AgentResponse>, String> {
    let agent = Agent::new();
    agent.get_history(&project_id)
        .map_err(|e| e.to_string())
}
