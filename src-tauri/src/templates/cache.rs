use std::path::PathBuf;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CacheMetadata {
    pub templates: HashMap<String, CachedTemplate>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CachedTemplate {
    pub id: String,
    pub version: String,
    pub cached_at: i64,
    pub file_path: PathBuf,
    pub size_bytes: u64,
}

pub struct TemplateCache {
    cache_dir: PathBuf,
    metadata: CacheMetadata,
}

impl TemplateCache {
    pub fn new(app_data_dir: PathBuf) -> Result<Self, String> {
        let cache_dir = app_data_dir.join("template_cache");
        if !cache_dir.exists() {
            std::fs::create_dir_all(&cache_dir)
                .map_err(|e| format!("Failed to create cache dir: {}", e))?;
        }
        
        let metadata_path = cache_dir.join("metadata.json");
        let metadata = if metadata_path.exists() {
            let data = std::fs::read_to_string(&metadata_path)
                .map_err(|e| format!("Failed to read metadata: {}", e))?;
            serde_json::from_str(&data)
                .unwrap_or_else(|_| CacheMetadata { templates: HashMap::new() })
        } else {
            CacheMetadata { templates: HashMap::new() }
        };
        
        Ok(Self { cache_dir, metadata })
    }
    
    pub fn get(&self, template_id: &str, version: &str) -> Option<PathBuf> {
        self.metadata.templates.get(template_id)
            .filter(|t| t.version == version)
            .map(|t| t.file_path.clone())
    }
    
    pub fn store(&mut self, template_id: String, version: String, file_path: PathBuf) -> Result<(), String> {
        let size_bytes = std::fs::metadata(&file_path)
            .map(|m| m.len())
            .unwrap_or(0);
            
        // Move file to cache dir if it's not already there
        let file_name = file_path.file_name()
            .ok_or("Invalid file path")?
            .to_string_lossy()
            .to_string();
            
        let cached_path = self.cache_dir.join(&file_name);
        
        if file_path != cached_path {
            std::fs::copy(&file_path, &cached_path)
                .map_err(|e| format!("Failed to copy file to cache: {}", e))?;
        }
        
        self.metadata.templates.insert(template_id.clone(), CachedTemplate {
            id: template_id,
            version,
            cached_at: chrono::Utc::now().timestamp(),
            file_path: cached_path,
            size_bytes,
        });
        
        self.save_metadata()
    }
    
    pub fn clear(&mut self) -> Result<(), String> {
        if self.cache_dir.exists() {
            std::fs::remove_dir_all(&self.cache_dir)
                .map_err(|e| format!("Failed to clear cache: {}", e))?;
            std::fs::create_dir_all(&self.cache_dir)
                .map_err(|e| format!("Failed to recreate cache dir: {}", e))?;
        }
        self.metadata.templates.clear();
        self.save_metadata()
    }
    
    fn save_metadata(&self) -> Result<(), String> {
        let metadata_path = self.cache_dir.join("metadata.json");
        let data = serde_json::to_string_pretty(&self.metadata)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;
        std::fs::write(metadata_path, data)
            .map_err(|e| format!("Failed to write metadata: {}", e))?;
        Ok(())
    }
    
    pub fn list_cached(&self) -> Vec<CachedTemplate> {
        self.metadata.templates.values().cloned().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    use tempfile::tempdir;

    #[test]
    fn test_cache_operations() {
        let temp_dir = tempdir().unwrap();
        let app_data_dir = temp_dir.path().to_path_buf();
        let mut cache = TemplateCache::new(app_data_dir.clone()).unwrap();

        // Create a dummy template file
        let template_path = temp_dir.path().join("template.zip");
        let mut file = File::create(&template_path).unwrap();
        writeln!(file, "dummy content").unwrap();

        // Store in cache
        cache.store(
            "test-template".to_string(),
            "v1".to_string(),
            template_path.clone()
        ).unwrap();

        // Verify it's in cache
        let cached_path = cache.get("test-template", "v1");
        assert!(cached_path.is_some());
        assert!(cached_path.unwrap().exists());

        // Verify metadata persistence
        let cache2 = TemplateCache::new(app_data_dir).unwrap();
        assert!(cache2.get("test-template", "v1").is_some());

        // Clear cache
        cache.clear().unwrap();
        assert!(cache.get("test-template", "v1").is_none());
    }
}
