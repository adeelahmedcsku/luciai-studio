use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use std::path::PathBuf;
use anyhow::{Result, Context};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: PathBuf,
    pub project_type: ProjectType,
    pub tech_stack: TechStack,
    pub created_at: DateTime<Utc>,
    pub last_modified: DateTime<Utc>,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProjectType {
    WebApp,
    MobileApp,
    DesktopApp,
    CLI,
    Backend,
    FullStack,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TechStack {
    pub frontend: Option<Vec<String>>,
    pub backend: Option<Vec<String>>,
    pub database: Option<String>,
    pub other: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMetadata {
    pub project: Project,
    pub prompt_history: Vec<PromptEntry>,
    pub file_count: usize,
    pub total_lines: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptEntry {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub user_prompt: String,
    pub agent_response: String,
    pub files_modified: Vec<String>,
}

pub struct ProjectManager {
    projects_dir: PathBuf,
}

impl ProjectManager {
    pub fn new() -> Result<Self> {
        let app_dir = dirs::data_dir()
            .context("Failed to get data directory")?
            .join(".sai-ide")
            .join("projects");
        
        std::fs::create_dir_all(&app_dir)?;
        
        Ok(Self { projects_dir: app_dir })
    }
    
    pub fn create_project(
        &self,
        name: String,
        project_type: ProjectType,
        tech_stack: TechStack,
        description: String,
    ) -> Result<Project> {
        let id = Uuid::new_v4().to_string();
        let project_path = self.projects_dir.join(&id);
        
        // Create project directory
        std::fs::create_dir_all(&project_path)?;
        
        // Create metadata directory
        let metadata_dir = project_path.join(".sai-metadata");
        std::fs::create_dir_all(&metadata_dir)?;
        
        let project = Project {
            id: id.clone(),
            name,
            path: project_path.clone(),
            project_type,
            tech_stack,
            created_at: Utc::now(),
            last_modified: Utc::now(),
            description,
        };
        
        // Save project metadata
        let metadata = ProjectMetadata {
            project: project.clone(),
            prompt_history: Vec::new(),
            file_count: 0,
            total_lines: 0,
        };
        
        self.save_metadata(&id, &metadata)?;
        
        tracing::info!("Created project: {} ({})", project.name, id);
        Ok(project)
    }
    
    pub fn list_projects(&self) -> Result<Vec<Project>> {
        let mut projects = Vec::new();
        
        if !self.projects_dir.exists() {
            return Ok(projects);
        }
        
        for entry in std::fs::read_dir(&self.projects_dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                let metadata_path = path.join(".sai-metadata").join("project.json");
                if metadata_path.exists() {
                    match self.load_metadata_from_path(&metadata_path) {
                        Ok(metadata) => projects.push(metadata.project),
                        Err(e) => tracing::warn!("Failed to load project metadata: {}", e),
                    }
                }
            }
        }
        
        // Sort by last modified (most recent first)
        projects.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));
        
        Ok(projects)
    }
    
    pub fn open_project(&self, project_id: &str) -> Result<ProjectMetadata> {
        let metadata_path = self.projects_dir
            .join(project_id)
            .join(".sai-metadata")
            .join("project.json");
        
        self.load_metadata_from_path(&metadata_path)
    }
    
    pub fn delete_project(&self, project_id: &str) -> Result<()> {
        let project_path = self.projects_dir.join(project_id);
        
        if project_path.exists() {
            std::fs::remove_dir_all(&project_path)?;
            tracing::info!("Deleted project: {}", project_id);
        }
        
        Ok(())
    }
    
    fn save_metadata(&self, project_id: &str, metadata: &ProjectMetadata) -> Result<()> {
        let metadata_path = self.projects_dir
            .join(project_id)
            .join(".sai-metadata")
            .join("project.json");
        
        let json = serde_json::to_string_pretty(metadata)?;
        std::fs::write(metadata_path, json)?;
        
        Ok(())
    }
    
    fn load_metadata_from_path(&self, path: &PathBuf) -> Result<ProjectMetadata> {
        let json = std::fs::read_to_string(path)?;
        let metadata: ProjectMetadata = serde_json::from_str(&json)?;
        Ok(metadata)
    }
    
    pub fn save_file(&self, project_id: &str, file_path: &str, content: &str) -> Result<()> {
        let project_dir = self.projects_dir.join(project_id);
        let full_path = project_dir.join(file_path);
        
        // Create parent directories if they don't exist
        if let Some(parent) = full_path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        
        std::fs::write(&full_path, content)?;
        tracing::info!("Saved file: {}", file_path);
        
        // Update project metadata
        self.update_file_stats(project_id)?;
        
        Ok(())
    }
    
    pub fn save_multiple_files(
        &self,
        project_id: &str,
        files: Vec<(String, String)>, // (path, content)
    ) -> Result<()> {
        for (path, content) in files {
            self.save_file(project_id, &path, &content)?;
        }
        Ok(())
    }
    
    pub fn add_prompt_entry(
        &self,
        project_id: &str,
        user_prompt: String,
        agent_response: String,
        files_modified: Vec<String>,
    ) -> Result<()> {
        let mut metadata = self.open_project(project_id)?;
        
        let entry = PromptEntry {
            id: Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            user_prompt,
            agent_response,
            files_modified,
        };
        
        metadata.prompt_history.push(entry);
        metadata.project.last_modified = Utc::now();
        
        self.save_metadata(project_id, &metadata)?;
        Ok(())
    }
    
    fn update_file_stats(&self, project_id: &str) -> Result<()> {
        let mut metadata = self.open_project(project_id)?;
        let project_dir = self.projects_dir.join(project_id);
        
        let (file_count, total_lines) = self.count_files_and_lines(&project_dir)?;
        
        metadata.file_count = file_count;
        metadata.total_lines = total_lines;
        metadata.project.last_modified = Utc::now();
        
        self.save_metadata(project_id, &metadata)?;
        Ok(())
    }
    
    fn count_files_and_lines(&self, dir: &PathBuf) -> Result<(usize, usize)> {
        let mut file_count = 0;
        let mut total_lines = 0;
        
        fn visit_dirs(dir: &PathBuf, file_count: &mut usize, total_lines: &mut usize) -> Result<()> {
            if dir.is_dir() {
                for entry in std::fs::read_dir(dir)? {
                    let entry = entry?;
                    let path = entry.path();
                    
                    // Skip hidden and metadata dirs
                    if let Some(name) = path.file_name() {
                        let name_str = name.to_string_lossy();
                        if name_str.starts_with('.') || name_str == "node_modules" {
                            continue;
                        }
                    }
                    
                    if path.is_dir() {
                        visit_dirs(&path, file_count, total_lines)?;
                    } else if path.is_file() {
                        *file_count += 1;
                        
                        // Count lines for text files
                        if let Ok(content) = std::fs::read_to_string(&path) {
                            *total_lines += content.lines().count();
                        }
                    }
                }
            }
            Ok(())
        }
        
        visit_dirs(dir, &mut file_count, &mut total_lines)?;
        Ok((file_count, total_lines))
    }
    
    pub fn get_file(&self, project_id: &str, file_path: &str) -> Result<String> {
        let project_dir = self.projects_dir.join(project_id);
        let full_path = project_dir.join(file_path);
        
        let content = std::fs::read_to_string(&full_path)
            .context(format!("Failed to read file: {}", file_path))?;
        
        Ok(content)
    }
    
    pub fn list_files(&self, project_id: &str) -> Result<Vec<String>> {
        let project_dir = self.projects_dir.join(project_id);
        let mut files = Vec::new();
        
        fn collect_files(dir: &PathBuf, base: &PathBuf, files: &mut Vec<String>) -> Result<()> {
            if dir.is_dir() {
                for entry in std::fs::read_dir(dir)? {
                    let entry = entry?;
                    let path = entry.path();
                    
                    // Skip hidden and metadata dirs
                    if let Some(name) = path.file_name() {
                        let name_str = name.to_string_lossy();
                        if name_str.starts_with('.') || name_str == "node_modules" {
                            continue;
                        }
                    }
                    
                    if path.is_dir() {
                        collect_files(&path, base, files)?;
                    } else if path.is_file() {
                        if let Ok(relative) = path.strip_prefix(base) {
                            files.push(relative.to_string_lossy().to_string());
                        }
                    }
                }
            }
            Ok(())
        }
        
        collect_files(&project_dir, &project_dir, &mut files)?;
        files.sort();
        
        Ok(files)
    }
}

// Tauri commands

#[tauri::command]
pub async fn create_project(
    name: String,
    project_type: ProjectType,
    tech_stack: TechStack,
    description: String,
) -> Result<Project, String> {
    let manager = ProjectManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.create_project(name, project_type, tech_stack, description)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_projects() -> Result<Vec<Project>, String> {
    let manager = ProjectManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.list_projects()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn open_project(project_id: String) -> Result<ProjectMetadata, String> {
    let manager = ProjectManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.open_project(&project_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_project(project_id: String) -> Result<(), String> {
    let manager = ProjectManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.delete_project(&project_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_file(
    project_id: String,
    file_path: String,
    content: String,
) -> Result<(), String> {
    let manager = ProjectManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.save_file(&project_id, &file_path, &content)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_multiple_files(
    project_id: String,
    files: Vec<(String, String)>,
) -> Result<(), String> {
    let manager = ProjectManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.save_multiple_files(&project_id, files)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_file(
    project_id: String,
    file_path: String,
) -> Result<String, String> {
    let manager = ProjectManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.get_file(&project_id, &file_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_project_files(project_id: String) -> Result<Vec<String>, String> {
    let manager = ProjectManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.list_files(&project_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_prompt_to_history(
    project_id: String,
    user_prompt: String,
    agent_response: String,
    files_modified: Vec<String>,
) -> Result<(), String> {
    let manager = ProjectManager::new()
        .map_err(|e| e.to_string())?;
    
    manager.add_prompt_entry(&project_id, user_prompt, agent_response, files_modified)
        .map_err(|e| e.to_string())
}
