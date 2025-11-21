use serde::{Deserialize, Serialize};
use anyhow::Result;

use crate::llm::{LLMClient, GenerationRequest};
use super::pipeline::ProjectPlan;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentGuide {
    pub platform: DeploymentPlatform,
    pub steps: Vec<DeploymentStep>,
    pub prerequisites: Vec<String>,
    pub environment_setup: String,
    pub deployment_script: Option<String>,
    pub ci_cd_config: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DeploymentPlatform {
    Vercel,
    Netlify,
    Railway,
    Heroku,
    AWS,
    DigitalOcean,
    Docker,
    Kubernetes,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentStep {
    pub order: usize,
    pub title: String,
    pub description: String,
    pub commands: Vec<String>,
    pub notes: Vec<String>,
}

pub struct DeploymentGenerator {
    llm_client: LLMClient,
}

impl DeploymentGenerator {
    pub fn new() -> Self {
        Self {
            llm_client: LLMClient::new(),
        }
    }
    
    /// Generate deployment guide for a platform
    pub async fn generate_deployment_guide(
        &self,
        plan: &ProjectPlan,
        platform: DeploymentPlatform,
    ) -> Result<DeploymentGuide> {
        let platform_name = self.platform_name(&platform);
        
        let prompt = format!(
            r#"Generate a comprehensive deployment guide for deploying this project to {platform}:

PROJECT: {name}
DESCRIPTION: {description}
DEPENDENCIES: {deps}

Create a step-by-step deployment guide in JSON format:
{{
  "steps": [
    {{
      "order": 1,
      "title": "Prepare Project",
      "description": "Detailed description of what to do",
      "commands": ["command1", "command2"],
      "notes": ["Important note 1", "Important note 2"]
    }}
  ],
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "environment_setup": "Detailed instructions for setting up environment variables",
  "deployment_script": "#!/bin/bash # Deployment script content",
  "ci_cd_config": "# CI/CD configuration file content"
}}

Include:
1. Account setup instructions
2. Project configuration
3. Environment variables setup
4. Build commands
5. Deployment commands
6. Custom domain setup (if applicable)
7. Monitoring and logs
8. Troubleshooting tips

Be specific to {platform} and include all necessary commands.
Generate ONLY valid JSON:"#,
            platform = platform_name,
            name = plan.name,
            description = plan.description,
            deps = plan.dependencies.iter()
                .take(5)
                .map(|d| d.name.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        );
        
        let request = GenerationRequest {
            model: "deepseek-coder-v2:16b".to_string(),
            prompt,
            system_prompt: Some(format!(
                "You are a DevOps expert specializing in {}. Generate complete, \
                accurate deployment guides with all necessary steps and commands.",
                platform_name
            )),
            temperature: 0.4,
            max_tokens: 3072,
        };
        
        let response = self.llm_client.generate(request).await?;
        let json_str = self.extract_json(&response.text)?;
        
        let mut guide: serde_json::Value = serde_json::from_str(&json_str)?;
        
        // Add platform to the guide
        guide["platform"] = serde_json::json!(platform);
        
        let deployment_guide: DeploymentGuide = serde_json::from_value(guide)?;
        
        Ok(deployment_guide)
    }
    
    /// Generate deployment guides for multiple platforms
    pub async fn generate_multiple_guides(
        &self,
        plan: &ProjectPlan,
        platforms: Vec<DeploymentPlatform>,
    ) -> Result<Vec<DeploymentGuide>> {
        let mut guides = Vec::new();
        
        for platform in platforms {
            match self.generate_deployment_guide(plan, platform).await {
                Ok(guide) => guides.push(guide),
                Err(e) => eprintln!("Failed to generate guide for platform: {}", e),
            }
        }
        
        Ok(guides)
    }
    
    /// Generate Docker configuration
    pub async fn generate_docker_config(
        &self,
        plan: &ProjectPlan,
    ) -> Result<(String, String)> {
        let prompt = format!(
            r#"Generate Docker configuration for this project:

PROJECT: {name}
DEPENDENCIES: {deps}

Generate TWO files:

1. Dockerfile - optimized multi-stage build
2. docker-compose.yml - for local development

Requirements:
- Use official base images
- Multi-stage build for smaller images
- Include health checks
- Proper volume mounts
- Environment variable support
- Security best practices

Respond in this format:
DOCKERFILE:
```dockerfile
[Dockerfile content]
```

DOCKER_COMPOSE:
```yaml
[docker-compose.yml content]
```"#,
            name = plan.name,
            deps = plan.dependencies.iter()
                .take(5)
                .map(|d| d.name.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        );
        
        let request = GenerationRequest {
            model: "deepseek-coder-v2:16b".to_string(),
            prompt,
            system_prompt: Some("You are a Docker expert. Generate optimized, production-ready Docker configurations.".to_string()),
            temperature: 0.5,
            max_tokens: 2048,
        };
        
        let response = self.llm_client.generate(request).await?;
        
        let (dockerfile, docker_compose) = self.extract_docker_files(&response.text)?;
        
        Ok((dockerfile, docker_compose))
    }
    
    /// Generate CI/CD configuration
    pub async fn generate_ci_cd_config(
        &self,
        plan: &ProjectPlan,
        platform: &str, // "github", "gitlab", "circleci", etc.
    ) -> Result<String> {
        let prompt = format!(
            r#"Generate a {platform} CI/CD configuration for this project:

PROJECT: {name}
DEPENDENCIES: {deps}

Requirements:
- Install dependencies
- Run tests
- Build project
- Deploy to staging/production
- Notify on success/failure
- Cache dependencies
- Run security scans

Generate a complete, production-ready CI/CD configuration.
Include comments explaining each step."#,
            platform = platform,
            name = plan.name,
            deps = plan.dependencies.iter()
                .take(5)
                .map(|d| d.name.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        );
        
        let request = GenerationRequest {
            model: "deepseek-coder-v2:16b".to_string(),
            prompt,
            system_prompt: Some(format!("You are a CI/CD expert. Generate complete {} workflow configurations.", platform)),
            temperature: 0.5,
            max_tokens: 2048,
        };
        
        let response = self.llm_client.generate(request).await?;
        let config = self.clean_code(&response.text);
        
        Ok(config)
    }
    
    // Helper methods
    
    fn platform_name(&self, platform: &DeploymentPlatform) -> &str {
        match platform {
            DeploymentPlatform::Vercel => "Vercel",
            DeploymentPlatform::Netlify => "Netlify",
            DeploymentPlatform::Railway => "Railway",
            DeploymentPlatform::Heroku => "Heroku",
            DeploymentPlatform::AWS => "AWS (Amazon Web Services)",
            DeploymentPlatform::DigitalOcean => "DigitalOcean",
            DeploymentPlatform::Docker => "Docker",
            DeploymentPlatform::Kubernetes => "Kubernetes",
        }
    }
    
    fn extract_json(&self, text: &str) -> Result<String> {
        let code_block_re = regex::Regex::new(r"```(?:json)?\s*\n(.*?)\n```").unwrap();
        if let Some(captures) = code_block_re.captures(text) {
            return Ok(captures.get(1).unwrap().as_str().to_string());
        }
        
        let json_re = regex::Regex::new(r"\{[\s\S]*\}").unwrap();
        if let Some(captures) = json_re.find(text) {
            return Ok(captures.as_str().to_string());
        }
        
        Ok(text.to_string())
    }
    
    fn clean_code(&self, text: &str) -> String {
        let code_block_re = regex::Regex::new(r"```[\w]*\s*\n([\s\S]*?)\n```").unwrap();
        if let Some(captures) = code_block_re.captures(text) {
            return captures.get(1).unwrap().as_str().to_string();
        }
        text.to_string()
    }
    
    fn extract_docker_files(&self, text: &str) -> Result<(String, String)> {
        let dockerfile_re = regex::Regex::new(r"DOCKERFILE:[\s\S]*?```[\w]*\s*\n([\s\S]*?)\n```").unwrap();
        let compose_re = regex::Regex::new(r"DOCKER_COMPOSE:[\s\S]*?```[\w]*\s*\n([\s\S]*?)\n```").unwrap();
        
        let dockerfile = dockerfile_re.captures(text)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().to_string())
            .unwrap_or_default();
        
        let docker_compose = compose_re.captures(text)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().to_string())
            .unwrap_or_default();
        
        Ok((dockerfile, docker_compose))
    }
}

// Tauri commands
#[tauri::command]
pub async fn generate_deployment_guide(
    project_name: String,
    project_description: String,
    platform: String,
) -> Result<DeploymentGuide, String> {
    let generator = DeploymentGenerator::new();
    
    // Create minimal plan from provided info
    let plan = super::pipeline::ProjectPlan {
        name: project_name,
        description: project_description,
        file_structure: Vec::new(),
        dependencies: Vec::new(),
        setup_commands: Vec::new(),
        environment_variables: Vec::new(),
    };
    
    let deployment_platform = match platform.to_lowercase().as_str() {
        "vercel" => DeploymentPlatform::Vercel,
        "netlify" => DeploymentPlatform::Netlify,
        "railway" => DeploymentPlatform::Railway,
        "heroku" => DeploymentPlatform::Heroku,
        "aws" => DeploymentPlatform::AWS,
        "digitalocean" => DeploymentPlatform::DigitalOcean,
        "docker" => DeploymentPlatform::Docker,
        "kubernetes" => DeploymentPlatform::Kubernetes,
        _ => DeploymentPlatform::Vercel,
    };
    
    generator.generate_deployment_guide(&plan, deployment_platform)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_docker_files(
    project_name: String,
    project_description: String,
) -> Result<(String, String), String> {
    let generator = DeploymentGenerator::new();
    
    let plan = super::pipeline::ProjectPlan {
        name: project_name,
        description: project_description,
        file_structure: Vec::new(),
        dependencies: Vec::new(),
        setup_commands: Vec::new(),
        environment_variables: Vec::new(),
    };
    
    generator.generate_docker_config(&plan)
        .await
        .map_err(|e| e.to_string())
}
