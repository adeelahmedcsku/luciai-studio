use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitConflict {
    pub file_path: String,
    pub ours: String,
    pub theirs: String,
    pub base: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommit {
    pub hash: String,
    pub author: String,
    pub date: String,
    pub message: String,
    pub parents: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitBranch {
    pub name: String,
    pub current: bool,
    pub remote: Option<String>,
    pub last_commit: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStash {
    pub index: usize,
    pub message: String,
    pub branch: String,
    pub date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitTag {
    pub name: String,
    pub commit: String,
    pub message: Option<String>,
    pub date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitRemote {
    pub name: String,
    pub url: String,
    pub fetch_url: String,
    pub push_url: String,
}

pub struct GitAdvanced {
    repo_path: PathBuf,
}

impl GitAdvanced {
    pub fn new(repo_path: PathBuf) -> Self {
        Self { repo_path }
    }
    
    // Conflict Resolution
    
    pub fn get_conflicts(&self) -> Result<Vec<GitConflict>> {
        let output = Command::new("git")
            .args(&["diff", "--name-only", "--diff-filter=U"])
            .current_dir(&self.repo_path)
            .output()?;
        
        let files = String::from_utf8_lossy(&output.stdout);
        let mut conflicts = Vec::new();
        
        for file_path in files.lines() {
            if let Ok(conflict) = self.parse_conflict(file_path) {
                conflicts.push(conflict);
            }
        }
        
        Ok(conflicts)
    }
    
    fn parse_conflict(&self, file_path: &str) -> Result<GitConflict> {
        let full_path = self.repo_path.join(file_path);
        let content = std::fs::read_to_string(&full_path)?;
        
        let mut ours = String::new();
        let mut theirs = String::new();
        let mut base = None;
        let mut in_ours = false;
        let mut in_theirs = false;
        
        for line in content.lines() {
            if line.starts_with("<<<<<<< ") {
                in_ours = true;
            } else if line.starts_with("=======") {
                in_ours = false;
                in_theirs = true;
            } else if line.starts_with(">>>>>>> ") {
                in_theirs = false;
            } else if in_ours {
                ours.push_str(line);
                ours.push('\n');
            } else if in_theirs {
                theirs.push_str(line);
                theirs.push('\n');
            }
        }
        
        Ok(GitConflict {
            file_path: file_path.to_string(),
            ours,
            theirs,
            base,
        })
    }
    
    pub fn resolve_conflict(&self, file_path: &str, resolution: &str) -> Result<()> {
        let full_path = self.repo_path.join(file_path);
        std::fs::write(&full_path, resolution)?;
        
        Command::new("git")
            .args(&["add", file_path])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    pub fn accept_ours(&self, file_path: &str) -> Result<()> {
        Command::new("git")
            .args(&["checkout", "--ours", file_path])
            .current_dir(&self.repo_path)
            .output()?;
        
        Command::new("git")
            .args(&["add", file_path])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    pub fn accept_theirs(&self, file_path: &str) -> Result<()> {
        Command::new("git")
            .args(&["checkout", "--theirs", file_path])
            .current_dir(&self.repo_path)
            .output()?;
        
        Command::new("git")
            .args(&["add", file_path])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    // Git History
    
    pub fn get_commit_history(&self, limit: usize) -> Result<Vec<GitCommit>> {
        let output = Command::new("git")
            .args(&[
                "log",
                &format!("-{}", limit),
                "--pretty=format:%H|%an|%ad|%s|%P",
                "--date=iso",
            ])
            .current_dir(&self.repo_path)
            .output()?;
        
        let log = String::from_utf8_lossy(&output.stdout);
        let mut commits = Vec::new();
        
        for line in log.lines() {
            let parts: Vec<&str> = line.split('|').collect();
            if parts.len() >= 4 {
                commits.push(GitCommit {
                    hash: parts[0].to_string(),
                    author: parts[1].to_string(),
                    date: parts[2].to_string(),
                    message: parts[3].to_string(),
                    parents: if parts.len() > 4 {
                        parts[4].split_whitespace().map(|s| s.to_string()).collect()
                    } else {
                        vec![]
                    },
                });
            }
        }
        
        Ok(commits)
    }
    
    pub fn get_file_history(&self, file_path: &str, limit: usize) -> Result<Vec<GitCommit>> {
        let output = Command::new("git")
            .args(&[
                "log",
                &format!("-{}", limit),
                "--pretty=format:%H|%an|%ad|%s",
                "--date=iso",
                "--",
                file_path,
            ])
            .current_dir(&self.repo_path)
            .output()?;
        
        let log = String::from_utf8_lossy(&output.stdout);
        let mut commits = Vec::new();
        
        for line in log.lines() {
            let parts: Vec<&str> = line.split('|').collect();
            if parts.len() >= 4 {
                commits.push(GitCommit {
                    hash: parts[0].to_string(),
                    author: parts[1].to_string(),
                    date: parts[2].to_string(),
                    message: parts[3].to_string(),
                    parents: vec![],
                });
            }
        }
        
        Ok(commits)
    }
    
    pub fn get_commit_diff(&self, commit_hash: &str) -> Result<String> {
        let output = Command::new("git")
            .args(&["show", commit_hash])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }
    
    // Stash Management
    
    pub fn stash_save(&self, message: Option<&str>) -> Result<()> {
        let mut args = vec!["stash", "push"];
        if let Some(msg) = message {
            args.push("-m");
            args.push(msg);
        }
        
        Command::new("git")
            .args(&args)
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    pub fn stash_list(&self) -> Result<Vec<GitStash>> {
        let output = Command::new("git")
            .args(&["stash", "list", "--pretty=format:%gd|%s|%gD|%cr"])
            .current_dir(&self.repo_path)
            .output()?;
        
        let list = String::from_utf8_lossy(&output.stdout);
        let mut stashes = Vec::new();
        
        for (idx, line) in list.lines().enumerate() {
            let parts: Vec<&str> = line.split('|').collect();
            if parts.len() >= 3 {
                stashes.push(GitStash {
                    index: idx,
                    message: parts[1].to_string(),
                    branch: parts[2].to_string(),
                    date: parts.get(3).unwrap_or(&"").to_string(),
                });
            }
        }
        
        Ok(stashes)
    }
    
    pub fn stash_apply(&self, index: usize) -> Result<()> {
        Command::new("git")
            .args(&["stash", "apply", &format!("stash@{{{}}}", index)])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    pub fn stash_pop(&self, index: usize) -> Result<()> {
        Command::new("git")
            .args(&["stash", "pop", &format!("stash@{{{}}}", index)])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    pub fn stash_drop(&self, index: usize) -> Result<()> {
        Command::new("git")
            .args(&["stash", "drop", &format!("stash@{{{}}}", index)])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    // Tag Management
    
    pub fn create_tag(&self, name: &str, message: Option<&str>) -> Result<()> {
        let mut args = vec!["tag"];
        if let Some(msg) = message {
            args.push("-a");
            args.push(name);
            args.push("-m");
            args.push(msg);
        } else {
            args.push(name);
        }
        
        Command::new("git")
            .args(&args)
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    pub fn list_tags(&self) -> Result<Vec<GitTag>> {
        let output = Command::new("git")
            .args(&["tag", "-l", "--format=%(refname:short)|%(objectname:short)|%(contents:subject)|%(creatordate:iso)"])
            .current_dir(&self.repo_path)
            .output()?;
        
        let list = String::from_utf8_lossy(&output.stdout);
        let mut tags = Vec::new();
        
        for line in list.lines() {
            let parts: Vec<&str> = line.split('|').collect();
            if parts.len() >= 3 {
                tags.push(GitTag {
                    name: parts[0].to_string(),
                    commit: parts[1].to_string(),
                    message: if parts[2].is_empty() { None } else { Some(parts[2].to_string()) },
                    date: parts.get(3).unwrap_or(&"").to_string(),
                });
            }
        }
        
        Ok(tags)
    }
    
    pub fn delete_tag(&self, name: &str) -> Result<()> {
        Command::new("git")
            .args(&["tag", "-d", name])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    pub fn push_tag(&self, name: &str) -> Result<()> {
        Command::new("git")
            .args(&["push", "origin", name])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    // Remote Management
    
    pub fn add_remote(&self, name: &str, url: &str) -> Result<()> {
        Command::new("git")
            .args(&["remote", "add", name, url])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    pub fn remove_remote(&self, name: &str) -> Result<()> {
        Command::new("git")
            .args(&["remote", "remove", name])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    pub fn list_remotes(&self) -> Result<Vec<GitRemote>> {
        let output = Command::new("git")
            .args(&["remote", "-v"])
            .current_dir(&self.repo_path)
            .output()?;
        
        let list = String::from_utf8_lossy(&output.stdout);
        let mut remotes_map = std::collections::HashMap::new();
        
        for line in list.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 {
                let name = parts[0];
                let url = parts[1];
                let remote_type = parts[2].trim_matches(|c| c == '(' || c == ')');
                
                let entry = remotes_map.entry(name.to_string()).or_insert(GitRemote {
                    name: name.to_string(),
                    url: url.to_string(),
                    fetch_url: String::new(),
                    push_url: String::new(),
                });
                
                if remote_type == "fetch" {
                    entry.fetch_url = url.to_string();
                } else if remote_type == "push" {
                    entry.push_url = url.to_string();
                }
            }
        }
        
        Ok(remotes_map.into_values().collect())
    }
    
    // Rebase
    
    pub fn rebase(&self, branch: &str) -> Result<()> {
        Command::new("git")
            .args(&["rebase", branch])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    pub fn rebase_abort(&self) -> Result<()> {
        Command::new("git")
            .args(&["rebase", "--abort"])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
    
    pub fn rebase_continue(&self) -> Result<()> {
        Command::new("git")
            .args(&["rebase", "--continue"])
            .current_dir(&self.repo_path)
            .output()?;
        
        Ok(())
    }
}

// Tauri commands

#[tauri::command]
pub async fn get_git_conflicts(repo_path: String) -> Result<Vec<GitConflict>, String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.get_conflicts().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn resolve_git_conflict(repo_path: String, file_path: String, resolution: String) -> Result<(), String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.resolve_conflict(&file_path, &resolution).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn accept_ours_conflict(repo_path: String, file_path: String) -> Result<(), String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.accept_ours(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn accept_theirs_conflict(repo_path: String, file_path: String) -> Result<(), String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.accept_theirs(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_commit_history(repo_path: String, limit: usize) -> Result<Vec<GitCommit>, String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.get_commit_history(limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_file_commit_history(repo_path: String, file_path: String, limit: usize) -> Result<Vec<GitCommit>, String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.get_file_history(&file_path, limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_stash_save(repo_path: String, message: Option<String>) -> Result<(), String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.stash_save(message.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_stash_list(repo_path: String) -> Result<Vec<GitStash>, String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.stash_list().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_stash_apply(repo_path: String, index: usize) -> Result<(), String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.stash_apply(index).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_create_tag(repo_path: String, name: String, message: Option<String>) -> Result<(), String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.create_tag(&name, message.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_list_tags(repo_path: String) -> Result<Vec<GitTag>, String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.list_tags().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_add_remote_advanced(repo_path: String, name: String, url: String) -> Result<(), String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.add_remote(&name, &url).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn git_list_remotes(repo_path: String) -> Result<Vec<GitRemote>, String> {
    let git = GitAdvanced::new(PathBuf::from(repo_path));
    git.list_remotes().map_err(|e| e.to_string())
}
