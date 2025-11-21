use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitRepository {
    pub path: PathBuf,
    pub current_branch: String,
    pub is_dirty: bool,
    pub remote_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatus {
    pub branch: String,
    pub ahead: usize,
    pub behind: usize,
    pub staged: Vec<String>,
    pub modified: Vec<String>,
    pub untracked: Vec<String>,
    pub conflicted: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommit {
    pub hash: String,
    pub short_hash: String,
    pub author: String,
    pub date: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBranch {
    pub name: String,
    pub is_current: bool,
    pub is_remote: bool,
    pub last_commit: Option<String>,
}

pub struct GitManager {
    repo_path: PathBuf,
}

impl GitManager {
    pub fn new(repo_path: PathBuf) -> Self {
        Self { repo_path }
    }
    
    /// Initialize a new Git repository
    pub fn init(&self) -> Result<()> {
        let output = Command::new("git")
            .args(&["init"])
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to initialize git repository")?;
        
        if !output.status.success() {
            anyhow::bail!("Git init failed: {}", String::from_utf8_lossy(&output.stderr));
        }
        
        // Create .gitignore
        self.create_default_gitignore()?;
        
        tracing::info!("Initialized git repository at {:?}", self.repo_path);
        Ok(())
    }
    
    /// Get repository status
    pub fn status(&self) -> Result<GitStatus> {
        let output = Command::new("git")
            .args(&["status", "--porcelain", "-b"])
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to get git status")?;
        
        if !output.status.success() {
            anyhow::bail!("Git status failed: {}", String::from_utf8_lossy(&output.stderr));
        }
        
        let status_text = String::from_utf8_lossy(&output.stdout);
        self.parse_status(&status_text)
    }
    
    /// Stage files
    pub fn add(&self, paths: Vec<String>) -> Result<()> {
        let mut args = vec!["add"];
        
        if paths.is_empty() || paths.iter().any(|p| p == ".") {
            args.push(".");
        } else {
            for path in &paths {
                args.push(path);
            }
        }
        
        let output = Command::new("git")
            .args(&args)
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to stage files")?;
        
        if !output.status.success() {
            anyhow::bail!("Git add failed: {}", String::from_utf8_lossy(&output.stderr));
        }
        
        tracing::info!("Staged files: {:?}", paths);
        Ok(())
    }
    
    /// Commit changes
    pub fn commit(&self, message: &str) -> Result<String> {
        let output = Command::new("git")
            .args(&["commit", "-m", message])
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to commit")?;
        
        if !output.status.success() {
            anyhow::bail!("Git commit failed: {}", String::from_utf8_lossy(&output.stderr));
        }
        
        let commit_output = String::from_utf8_lossy(&output.stdout);
        tracing::info!("Committed: {}", message);
        
        // Extract commit hash
        self.get_latest_commit_hash()
    }
    
    /// Get commit history
    pub fn log(&self, count: usize) -> Result<Vec<GitCommit>> {
        let output = Command::new("git")
            .args(&[
                "log",
                &format!("-{}", count),
                "--pretty=format:%H|%h|%an|%ad|%s",
                "--date=short"
            ])
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to get git log")?;
        
        if !output.status.success() {
            anyhow::bail!("Git log failed: {}", String::from_utf8_lossy(&output.stderr));
        }
        
        let log_text = String::from_utf8_lossy(&output.stdout);
        self.parse_log(&log_text)
    }
    
    /// List branches
    pub fn branches(&self) -> Result<Vec<GitBranch>> {
        let output = Command::new("git")
            .args(&["branch", "-a", "-v"])
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to list branches")?;
        
        if !output.status.success() {
            anyhow::bail!("Git branch failed: {}", String::from_utf8_lossy(&output.stderr));
        }
        
        let branches_text = String::from_utf8_lossy(&output.stdout);
        self.parse_branches(&branches_text)
    }
    
    /// Create a new branch
    pub fn create_branch(&self, name: &str) -> Result<()> {
        let output = Command::new("git")
            .args(&["branch", name])
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to create branch")?;
        
        if !output.status.success() {
            anyhow::bail!("Git branch creation failed: {}", String::from_utf8_lossy(&output.stderr));
        }
        
        tracing::info!("Created branch: {}", name);
        Ok(())
    }
    
    /// Switch to a branch
    pub fn checkout(&self, branch: &str) -> Result<()> {
        let output = Command::new("git")
            .args(&["checkout", branch])
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to checkout branch")?;
        
        if !output.status.success() {
            anyhow::bail!("Git checkout failed: {}", String::from_utf8_lossy(&output.stderr));
        }
        
        tracing::info!("Checked out branch: {}", branch);
        Ok(())
    }
    
    /// Pull from remote
    pub fn pull(&self, remote: &str, branch: &str) -> Result<String> {
        let output = Command::new("git")
            .args(&["pull", remote, branch])
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to pull")?;
        
        if !output.status.success() {
            anyhow::bail!("Git pull failed: {}", String::from_utf8_lossy(&output.stderr));
        }
        
        let result = String::from_utf8_lossy(&output.stdout).to_string();
        tracing::info!("Pulled from {}/{}", remote, branch);
        Ok(result)
    }
    
    /// Push to remote
    pub fn push(&self, remote: &str, branch: &str) -> Result<String> {
        let output = Command::new("git")
            .args(&["push", remote, branch])
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to push")?;
        
        if !output.status.success() {
            anyhow::bail!("Git push failed: {}", String::from_utf8_lossy(&output.stderr));
        }
        
        let result = String::from_utf8_lossy(&output.stderr).to_string(); // Git outputs to stderr
        tracing::info!("Pushed to {}/{}", remote, branch);
        Ok(result)
    }
    
    /// Add remote
    pub fn add_remote(&self, name: &str, url: &str) -> Result<()> {
        let output = Command::new("git")
            .args(&["remote", "add", name, url])
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to add remote")?;
        
        if !output.status.success() {
            anyhow::bail!("Git remote add failed: {}", String::from_utf8_lossy(&output.stderr));
        }
        
        tracing::info!("Added remote {} -> {}", name, url);
        Ok(())
    }
    
    /// Get diff for a file
    pub fn diff(&self, file: Option<&str>) -> Result<String> {
        let mut args = vec!["diff"];
        if let Some(f) = file {
            args.push(f);
        }
        
        let output = Command::new("git")
            .args(&args)
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to get diff")?;
        
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }
    
    /// Clone a repository
    pub fn clone(url: &str, destination: &PathBuf) -> Result<()> {
        let output = Command::new("git")
            .args(&["clone", url, &destination.to_string_lossy()])
            .output()
            .context("Failed to clone repository")?;
        
        if !output.status.success() {
            anyhow::bail!("Git clone failed: {}", String::from_utf8_lossy(&output.stderr));
        }
        
        tracing::info!("Cloned {} to {:?}", url, destination);
        Ok(())
    }
    
    // Helper methods
    
    fn create_default_gitignore(&self) -> Result<()> {
        let gitignore_content = r#"# Dependencies
node_modules/
vendor/
__pycache__/
*.pyc

# Build outputs
dist/
build/
target/
*.exe
*.dll
*.so
*.dylib

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
*.log

# Project specific
.sai-metadata/
"#;
        
        let gitignore_path = self.repo_path.join(".gitignore");
        std::fs::write(gitignore_path, gitignore_content)?;
        
        Ok(())
    }
    
    fn parse_status(&self, status_text: &str) -> Result<GitStatus> {
        let mut branch = "main".to_string();
        let mut ahead = 0;
        let mut behind = 0;
        let mut staged = Vec::new();
        let mut modified = Vec::new();
        let mut untracked = Vec::new();
        let mut conflicted = Vec::new();
        
        for line in status_text.lines() {
            if line.starts_with("##") {
                // Parse branch info
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() > 1 {
                    branch = parts[1].split("...").next().unwrap_or("main").to_string();
                }
                
                // Parse ahead/behind
                if line.contains("ahead") {
                    if let Some(num) = line.split("ahead ").nth(1) {
                        ahead = num.split(']').next()
                            .and_then(|s| s.parse().ok())
                            .unwrap_or(0);
                    }
                }
                if line.contains("behind") {
                    if let Some(num) = line.split("behind ").nth(1) {
                        behind = num.split(']').next()
                            .and_then(|s| s.parse().ok())
                            .unwrap_or(0);
                    }
                }
            } else if line.len() > 2 {
                let status = &line[..2];
                let file = line[3..].trim().to_string();
                
                match status {
                    "A " | "M " | "D " => staged.push(file),
                    " M" | " D" => modified.push(file),
                    "??" => untracked.push(file),
                    "UU" | "AA" => conflicted.push(file),
                    _ => {}
                }
            }
        }
        
        Ok(GitStatus {
            branch,
            ahead,
            behind,
            staged,
            modified,
            untracked,
            conflicted,
        })
    }
    
    fn parse_log(&self, log_text: &str) -> Result<Vec<GitCommit>> {
        let mut commits = Vec::new();
        
        for line in log_text.lines() {
            let parts: Vec<&str> = line.split('|').collect();
            if parts.len() == 5 {
                commits.push(GitCommit {
                    hash: parts[0].to_string(),
                    short_hash: parts[1].to_string(),
                    author: parts[2].to_string(),
                    date: parts[3].to_string(),
                    message: parts[4].to_string(),
                });
            }
        }
        
        Ok(commits)
    }
    
    fn parse_branches(&self, branches_text: &str) -> Result<Vec<GitBranch>> {
        let mut branches = Vec::new();
        
        for line in branches_text.lines() {
            let is_current = line.starts_with('*');
            let is_remote = line.contains("remotes/");
            
            let parts: Vec<&str> = line.trim_start_matches('*').trim().split_whitespace().collect();
            if !parts.is_empty() {
                let name = parts[0].to_string();
                let last_commit = if parts.len() > 1 {
                    Some(parts[1].to_string())
                } else {
                    None
                };
                
                branches.push(GitBranch {
                    name,
                    is_current,
                    is_remote,
                    last_commit,
                });
            }
        }
        
        Ok(branches)
    }
    
    fn get_latest_commit_hash(&self) -> Result<String> {
        let output = Command::new("git")
            .args(&["rev-parse", "HEAD"])
            .current_dir(&self.repo_path)
            .output()
            .context("Failed to get commit hash")?;
        
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }
}

// Tauri commands
#[tauri::command]
pub async fn git_init(repo_path: String) -> Result<(), String> {
    let manager = GitManager::new(PathBuf::from(repo_path));
    manager.init().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_status(repo_path: String) -> Result<GitStatus, String> {
    let manager = GitManager::new(PathBuf::from(repo_path));
    manager.status().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_add(repo_path: String, paths: Vec<String>) -> Result<(), String> {
    let manager = GitManager::new(PathBuf::from(repo_path));
    manager.add(paths).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_commit(repo_path: String, message: String) -> Result<String, String> {
    let manager = GitManager::new(PathBuf::from(repo_path));
    manager.commit(&message).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_log(repo_path: String, count: usize) -> Result<Vec<GitCommit>, String> {
    let manager = GitManager::new(PathBuf::from(repo_path));
    manager.log(count).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_branches(repo_path: String) -> Result<Vec<GitBranch>, String> {
    let manager = GitManager::new(PathBuf::from(repo_path));
    manager.branches().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_create_branch(repo_path: String, name: String) -> Result<(), String> {
    let manager = GitManager::new(PathBuf::from(repo_path));
    manager.create_branch(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_checkout(repo_path: String, branch: String) -> Result<(), String> {
    let manager = GitManager::new(PathBuf::from(repo_path));
    manager.checkout(&branch).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_pull(repo_path: String, remote: String, branch: String) -> Result<String, String> {
    let manager = GitManager::new(PathBuf::from(repo_path));
    manager.pull(&remote, &branch).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_push(repo_path: String, remote: String, branch: String) -> Result<String, String> {
    let manager = GitManager::new(PathBuf::from(repo_path));
    manager.push(&remote, &branch).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_add_remote(repo_path: String, name: String, url: String) -> Result<(), String> {
    let manager = GitManager::new(PathBuf::from(repo_path));
    manager.add_remote(&name, &url).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_diff(repo_path: String, file: Option<String>) -> Result<String, String> {
    let manager = GitManager::new(PathBuf::from(repo_path));
    manager.diff(file.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_clone(url: String, destination: String) -> Result<(), String> {
    GitManager::clone(&url, &PathBuf::from(destination)).map_err(|e| e.to_string())
}
