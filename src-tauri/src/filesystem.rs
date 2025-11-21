use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
    pub modified: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectoryListing {
    pub path: String,
    pub files: Vec<FileInfo>,
}

/// Read a file from the filesystem
#[command]
pub async fn read_file(path: String) -> Result<String, String> {
    tracing::info!("Reading file: {}", path);
    
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

/// Write content to a file
#[command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    tracing::info!("Writing file: {}", path);
    
    // Create parent directories if they don't exist
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }
    
    fs::write(&path, content)
        .map_err(|e| format!("Failed to write file: {}", e))
}

/// Delete a file
#[command]
pub async fn delete_file(path: String) -> Result<(), String> {
    tracing::info!("Deleting file: {}", path);
    
    fs::remove_file(&path)
        .map_err(|e| format!("Failed to delete file: {}", e))
}

/// List directory contents
#[command]
pub async fn list_directory(path: String) -> Result<DirectoryListing, String> {
    tracing::info!("Listing directory: {}", path);
    
    let entries = fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
    let mut files = Vec::new();
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry.metadata()
            .map_err(|e| format!("Failed to read metadata: {}", e))?;
        
        let modified = metadata.modified()
            .map_err(|e| format!("Failed to read modified time: {}", e))?
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| format!("Failed to convert time: {}", e))?
            .as_secs();
        
        files.push(FileInfo {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_directory: metadata.is_dir(),
            size: metadata.len(),
            modified,
        });
    }
    
    // Sort: directories first, then alphabetically
    files.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(DirectoryListing { path, files })
}

/// Create a new directory
#[command]
pub async fn create_directory(path: String) -> Result<(), String> {
    tracing::info!("Creating directory: {}", path);
    
    fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create directory: {}", e))
}

/// Delete a directory
#[command]
pub async fn delete_directory(path: String) -> Result<(), String> {
    tracing::info!("Deleting directory: {}", path);
    
    fs::remove_dir_all(&path)
        .map_err(|e| format!("Failed to delete directory: {}", e))
}

/// Check if a path exists
#[command]
pub async fn path_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

/// Get file/directory metadata
#[command]
pub async fn get_metadata(path: String) -> Result<FileInfo, String> {
    let metadata = fs::metadata(&path)
        .map_err(|e| format!("Failed to read metadata: {}", e))?;
    
    let modified = metadata.modified()
        .map_err(|e| format!("Failed to read modified time: {}", e))?
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Failed to convert time: {}", e))?
        .as_secs();
    
    Ok(FileInfo {
        name: Path::new(&path)
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        path: path.clone(),
        is_directory: metadata.is_dir(),
        size: metadata.len(),
        modified,
    })
}

/// Rename/move a file or directory
#[command]
pub async fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    tracing::info!("Renaming {} to {}", old_path, new_path);
    
    fs::rename(&old_path, &new_path)
        .map_err(|e| format!("Failed to rename: {}", e))
}

/// Copy a file
#[command]
pub async fn copy_file(source: String, destination: String) -> Result<(), String> {
    tracing::info!("Copying {} to {}", source, destination);
    
    // Create parent directories if they don't exist
    if let Some(parent) = Path::new(&destination).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }
    
    fs::copy(&source, &destination)
        .map_err(|e| format!("Failed to copy file: {}", e))?;
    
    Ok(())
}

/// Search for files in a directory (recursive)
#[command]
pub async fn search_files(
    directory: String,
    pattern: String,
    max_results: Option<usize>,
) -> Result<Vec<FileInfo>, String> {
    tracing::info!("Searching for '{}' in {}", pattern, directory);
    
    let max_results = max_results.unwrap_or(100);
    let mut results = Vec::new();
    let pattern_lower = pattern.to_lowercase();
    
    fn search_recursive(
        dir: &Path,
        pattern: &str,
        results: &mut Vec<FileInfo>,
        max_results: usize,
    ) -> Result<(), String> {
        if results.len() >= max_results {
            return Ok(());
        }
        
        let entries = fs::read_dir(dir)
            .map_err(|e| format!("Failed to read directory: {}", e))?;
        
        for entry in entries {
            if results.len() >= max_results {
                break;
            }
            
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            
            // Skip hidden files and common ignore patterns
            if name.starts_with('.') || name == "node_modules" || name == "target" {
                continue;
            }
            
            // Check if name matches pattern
            if name.to_lowercase().contains(pattern) {
                let metadata = entry.metadata()
                    .map_err(|e| format!("Failed to read metadata: {}", e))?;
                
                let modified = metadata.modified()
                    .map_err(|e| format!("Failed to read modified time: {}", e))?
                    .duration_since(std::time::UNIX_EPOCH)
                    .map_err(|e| format!("Failed to convert time: {}", e))?
                    .as_secs();
                
                results.push(FileInfo {
                    name: name.clone(),
                    path: path.to_string_lossy().to_string(),
                    is_directory: metadata.is_dir(),
                    size: metadata.len(),
                    modified,
                });
            }
            
            // Recurse into directories
            if path.is_dir() {
                let _ = search_recursive(&path, pattern, results, max_results);
            }
        }
        
        Ok(())
    }
    
    search_recursive(Path::new(&directory), &pattern_lower, &mut results, max_results)?;
    
    Ok(results)
}
