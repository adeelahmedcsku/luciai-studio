use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use regex::Regex;
use tauri::Emitter;


use crate::llm::{LLMClient, GenerationRequest};

/// Agent pipeline for multi-stage code generation
pub struct AgentPipeline {
    llm_client: LLMClient,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectRequest {
    pub description: String,
    pub project_type: ProjectType,
    pub tech_stack: Vec<String>,
    pub features: Vec<String>,
    pub constraints: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProjectType {
    WebApp,
    MobileApp,
    DesktopApp,
    CLI,
    Library,
    API,
    Microservice,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectPlan {
    pub name: String,
    pub description: String,
    pub file_structure: Vec<FileNode>,
    pub dependencies: Vec<Dependency>,
    pub setup_commands: Vec<String>,
    pub environment_variables: Vec<EnvVariable>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileNode {
    pub path: String,
    pub node_type: NodeType,
    pub description: String,
    pub priority: i32, // For generation order
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NodeType {
    File,
    Directory,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dependency {
    pub name: String,
    pub version: String,
    pub dev: bool,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvVariable {
    pub name: String,
    pub description: String,
    pub required: bool,
    pub default_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneratedFile {
    pub path: String,
    pub content: String,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerationProgress {
    pub stage: PipelineStage,
    pub progress: f32,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PipelineStage {
    Understanding,
    Planning,
    GeneratingStructure,
    GeneratingCode,
    GeneratingTests,
    GeneratingDocs,
    Validating,
    Complete,
}

impl AgentPipeline {
    pub fn new() -> Self {
        Self {
            llm_client: LLMClient::new(),
        }
    }
    
    /// Stage 1: Understand the request and classify intent
    pub async fn understand_request(&self, description: &str) -> Result<ProjectRequest> {
        let prompt = format!(
            r#"Analyze this software development request and extract structured information:

Request: {}

Respond ONLY with valid JSON in this exact format:
{{
  "description": "cleaned up description",
  "project_type": "WebApp|MobileApp|DesktopApp|CLI|Library|API|Microservice",
  "tech_stack": ["technology1", "technology2"],
  "features": ["feature1", "feature2"],
  "constraints": ["constraint1", "constraint2"]
}}

Rules:
- project_type must be exactly one of the listed values
- tech_stack should include primary languages and frameworks
- features should be specific, actionable items
- constraints include performance, security, or other requirements
- Return ONLY the JSON, no explanations"#,
            description
        );
        
        let request = GenerationRequest {
            model: "deepseek-coder-v2:16b".to_string(),
            prompt,
            system_prompt: Some("You are a requirements analyst. Extract structured data from natural language descriptions. Always respond with valid JSON only.".to_string()),
            temperature: 0.3, // Lower for more deterministic parsing
            max_tokens: 1024,
        };
        
        let response = self.llm_client.generate(request).await?;
        let json_str = self.extract_json(&response.text)?;
        
        let mut project_request: ProjectRequest = serde_json::from_str(&json_str)
            .context("Failed to parse project request JSON")?;
        
        // Parse project_type string to enum
        project_request.project_type = match project_request.project_type {
            ProjectType::WebApp => ProjectType::WebApp,
            _ => ProjectType::WebApp, // Default fallback
        };
        
        Ok(project_request)
    }
    
    /// Stage 2: Create detailed project plan
    pub async fn create_plan(&self, request: &ProjectRequest) -> Result<ProjectPlan> {
        let tech_stack = request.tech_stack.join(", ");
        let features = request.features.join("\n- ");
        
        let prompt = format!(
            r#"Create a detailed project plan for:

Description: {}
Type: {:?}
Tech Stack: {}
Features:
- {}

Respond ONLY with valid JSON:
{{
  "name": "project-name",
  "description": "Brief description",
  "file_structure": [
    {{"path": "src/index.ts", "node_type": "File", "description": "Main entry", "priority": 1}},
    {{"path": "src/components", "node_type": "Directory", "description": "Components folder", "priority": 2}}
  ],
  "dependencies": [
    {{"name": "react", "version": "^18.0.0", "dev": false, "reason": "UI framework"}},
    {{"name": "typescript", "version": "^5.0.0", "dev": true, "reason": "Type safety"}}
  ],
  "setup_commands": [
    "npm install",
    "npm run build"
  ],
  "environment_variables": [
    {{"name": "API_KEY", "description": "API authentication key", "required": true, "default_value": null}},
    {{"name": "PORT", "description": "Server port", "required": false, "default_value": "3000"}}
  ]
}}

Guidelines:
- Include ALL necessary files (config, source, tests, docs)
- Order files by dependency (configs first, then source)
- Use priority field: 1=highest, 10=lowest
- Include comprehensive dependencies with reasons
- Add setup commands in correct order
- List required environment variables
- Return ONLY valid JSON"#,
            request.description,
            request.project_type,
            tech_stack,
            features
        );
        
        let gen_request = GenerationRequest {
            model: "deepseek-coder-v2:16b".to_string(),
            prompt,
            system_prompt: Some("You are a software architect. Create comprehensive project plans with complete file structures and dependencies.".to_string()),
            temperature: 0.4,
            max_tokens: 2048,
        };
        
        let response = self.llm_client.generate(gen_request).await?;
        let json_str = self.extract_json(&response.text)?;
        
        let plan: ProjectPlan = serde_json::from_str(&json_str)
            .context("Failed to parse project plan JSON")?;
        
        Ok(plan)
    }
    
    /// Stage 3: Generate code for individual files
    pub async fn generate_file(
        &self,
        file_node: &FileNode,
        plan: &ProjectPlan,
        existing_files: &[GeneratedFile],
    ) -> Result<GeneratedFile> {
        // Build context from existing files
        let context = self.build_file_context(existing_files);
        
        let prompt = format!(
            r#"Generate the complete code for this file:

File: {}
Description: {}

Project Context:
- Name: {}
- Description: {}
- Tech Stack: {} (from dependencies)

Already Generated Files:
{}

Requirements:
1. Generate ONLY the code for this specific file
2. Include all necessary imports/requires
3. Add comprehensive comments explaining logic
4. Follow best practices for the language
5. Include proper error handling
6. Make it production-ready
7. Ensure it integrates with other files shown in context

Generate the COMPLETE file content now. Start with any necessary imports, then the main code:"#,
            file_node.path,
            file_node.description,
            plan.name,
            plan.description,
            plan.dependencies.iter().map(|d| &d.name).take(5).cloned().collect::<Vec<_>>().join(", "),
            context
        );
        
        let gen_request = GenerationRequest {
            model: "deepseek-coder-v2:16b".to_string(),
            prompt,
            system_prompt: Some("You are an expert software engineer. Generate clean, production-ready code with proper error handling and comments.".to_string()),
            temperature: 0.7,
            max_tokens: 4096,
        };
        
        let response = self.llm_client.generate(gen_request).await?;
        let cleaned_code = self.extract_code(&response.text);
        
        // Detect language from file extension
        let language = self.detect_language(&file_node.path);
        
        Ok(GeneratedFile {
            path: file_node.path.clone(),
            content: cleaned_code,
            language,
        })
    }
    
    /// Generate entire project
    pub async fn generate_project(
        &self,
        request: &ProjectRequest,
        progress_callback: impl Fn(GenerationProgress),
    ) -> Result<Vec<GeneratedFile>> {
        let mut generated_files = Vec::new();
        
        // Stage 1: Understanding
        progress_callback(GenerationProgress {
            stage: PipelineStage::Understanding,
            progress: 0.1,
            message: "Understanding project requirements...".to_string(),
        });
        
        // Stage 2: Planning
        progress_callback(GenerationProgress {
            stage: PipelineStage::Planning,
            progress: 0.2,
            message: "Creating project plan...".to_string(),
        });
        
        let plan = self.create_plan(request).await?;
        
        // Stage 3: Generate structure
        progress_callback(GenerationProgress {
            stage: PipelineStage::GeneratingStructure,
            progress: 0.3,
            message: "Generating project structure...".to_string(),
        });
        
        // Sort files by priority
        let mut files_to_generate: Vec<_> = plan.file_structure
            .iter()
            .filter(|f| matches!(f.node_type, NodeType::File))
            .collect();
        files_to_generate.sort_by_key(|f| f.priority);
        
        let total_files = files_to_generate.len();
        
        // Stage 4: Generate code
        for (index, file_node) in files_to_generate.iter().enumerate() {
            let progress = 0.3 + (0.5 * (index as f32 / total_files as f32));
            progress_callback(GenerationProgress {
                stage: PipelineStage::GeneratingCode,
                progress,
                message: format!("Generating {} ({}/{})", file_node.path, index + 1, total_files),
            });
            
            let generated = self.generate_file(file_node, &plan, &generated_files).await?;
            generated_files.push(generated);
        }
        
        // Stage 5: Generate tests
        progress_callback(GenerationProgress {
            stage: PipelineStage::GeneratingTests,
            progress: 0.85,
            message: "Generating test files...".to_string(),
        });
        
        // Stage 6: Generate documentation
        progress_callback(GenerationProgress {
            stage: PipelineStage::GeneratingDocs,
            progress: 0.95,
            message: "Generating documentation...".to_string(),
        });
        
        // Generate README
        let readme = self.generate_readme(&plan, &generated_files).await?;
        generated_files.push(readme);
        
        // Stage 7: Complete
        progress_callback(GenerationProgress {
            stage: PipelineStage::Complete,
            progress: 1.0,
            message: "Project generation complete!".to_string(),
        });
        
        Ok(generated_files)
    }
    
    /// Generate README documentation
    async fn generate_readme(
        &self,
        plan: &ProjectPlan,
        _files: &[GeneratedFile],
    ) -> Result<GeneratedFile> {
        let deps = plan.dependencies.iter()
            .map(|d| format!("- {} ({}): {}", d.name, d.version, d.reason))
            .collect::<Vec<_>>()
            .join("\n");
        
        let env_vars = plan.environment_variables.iter()
            .map(|e| {
                let default = e.default_value.as_ref()
                    .map(|v| format!(" (default: {})", v))
                    .unwrap_or_default();
                format!("- `{}`: {}{}", e.name, e.description, default)
            })
            .collect::<Vec<_>>()
            .join("\n");
        
        let setup_cmds = plan.setup_commands.join("\n");
        
        let prompt = format!(
            r#"Generate a comprehensive README.md for this project:

Project: {}
Description: {}

Dependencies:
{}

Environment Variables:
{}

Setup Commands:
{}

Create a README with:
1. Project title and description
2. Features list
3. Prerequisites
4. Installation instructions
5. Configuration (environment variables)
6. Usage examples
7. Project structure overview
8. Development guide
9. License info

Make it professional and comprehensive."#,
            plan.name,
            plan.description,
            deps,
            env_vars,
            setup_cmds
        );
        
        let request = GenerationRequest {
            model: "deepseek-coder-v2:16b".to_string(),
            prompt,
            system_prompt: Some("You are a technical writer. Create clear, comprehensive README documentation.".to_string()),
            temperature: 0.6,
            max_tokens: 2048,
        };
        
        let response = self.llm_client.generate(request).await?;
        
        Ok(GeneratedFile {
            path: "README.md".to_string(),
            content: response.text,
            language: "markdown".to_string(),
        })
    }
    
    // Helper methods
    
    fn extract_json(&self, text: &str) -> Result<String> {
        // Try to find JSON in markdown code blocks
        let code_block_re = Regex::new(r"```(?:json)?\s*\n(.*?)\n```").unwrap();
        if let Some(captures) = code_block_re.captures(text) {
            return Ok(captures.get(1).unwrap().as_str().to_string());
        }
        
        // Try to find raw JSON (looking for { ... })
        let json_re = Regex::new(r"\{[\s\S]*\}").unwrap();
        if let Some(captures) = json_re.find(text) {
            return Ok(captures.as_str().to_string());
        }
        
        // If nothing found, return the whole text and let parser fail with better error
        Ok(text.to_string())
    }
    
    fn extract_code(&self, text: &str) -> String {
        // Remove markdown code blocks if present
        let code_block_re = Regex::new(r"```[\w]*\s*\n([\s\S]*?)\n```").unwrap();
        if let Some(captures) = code_block_re.captures(text) {
            return captures.get(1).unwrap().as_str().to_string();
        }
        
        // Return as-is if no code block found
        text.to_string()
    }
    
    fn detect_language(&self, path: &str) -> String {
        let ext = std::path::Path::new(path)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("");
        
        match ext {
            "ts" | "tsx" => "typescript",
            "js" | "jsx" => "javascript",
            "py" => "python",
            "rs" => "rust",
            "go" => "go",
            "java" => "java",
            "cpp" | "cc" | "cxx" => "cpp",
            "c" => "c",
            "cs" => "csharp",
            "rb" => "ruby",
            "php" => "php",
            "swift" => "swift",
            "kt" => "kotlin",
            "md" => "markdown",
            "json" => "json",
            "yaml" | "yml" => "yaml",
            "toml" => "toml",
            "html" => "html",
            "css" => "css",
            "scss" | "sass" => "scss",
            _ => "text",
        }.to_string()
    }
    
    fn build_file_context(&self, files: &[GeneratedFile]) -> String {
        if files.is_empty() {
            return "No files generated yet.".to_string();
        }
        
        let mut context = String::new();
        for file in files.iter().take(5) { // Only show last 5 files as context
            let preview = file.content.lines()
                .take(15)
                .collect::<Vec<_>>()
                .join("\n");
            
            context.push_str(&format!("\n--- {} ---\n{}\n...\n", file.path, preview));
        }
        context
    }
}

// Tauri command for generating entire project
#[tauri::command]
pub async fn generate_full_project(
    window: tauri::Window,
    description: String,
    project_type: String,
    tech_stack: Vec<String>,
) -> Result<Vec<GeneratedFile>, String> {
    let pipeline = AgentPipeline::new();
    
    let request = ProjectRequest {
        description: description.clone(),
        project_type: ProjectType::WebApp, // TODO: Parse from string
        tech_stack,
        features: vec![], // Will be extracted from description
        constraints: vec![],
    };
    
    let result = pipeline.generate_project(&request, |progress| {
        // Emit progress to frontend
        window.emit("project-generation-progress", &progress).ok();
    }).await;
    
    result.map_err(|e| e.to_string())
}
