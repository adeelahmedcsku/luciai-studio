use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use std::path::PathBuf;
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeSnippet {
    pub id: String,
    pub name: String,
    pub description: String,
    pub language: String,
    pub code: String,
    pub prefix: String, // Trigger text for auto-completion
    pub tags: Vec<String>,
    pub category: SnippetCategory,
    pub created_at: String,
    pub updated_at: String,
    pub usage_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SnippetCategory {
    React,
    TypeScript,
    JavaScript,
    Python,
    Rust,
    HTML,
    CSS,
    Node,
    Testing,
    Utility,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnippetCollection {
    pub name: String,
    pub description: String,
    pub snippets: Vec<CodeSnippet>,
}

pub struct SnippetManager {
    snippets_dir: PathBuf,
}

impl SnippetManager {
    pub fn new() -> Result<Self> {
        let snippets_dir = dirs::data_dir()
            .context("Failed to get data directory")?
            .join(".sai-ide")
            .join("snippets");
        
        std::fs::create_dir_all(&snippets_dir)?;
        
        // Initialize default snippets if not exist
        let default_file = snippets_dir.join("default.json");
        if !default_file.exists() {
            let mut manager = Self { snippets_dir: snippets_dir.clone() };
            manager.initialize_default_snippets()?;
        }
        
        Ok(Self { snippets_dir })
    }
    
    /// Create a new snippet
    pub fn create_snippet(&self, mut snippet: CodeSnippet) -> Result<CodeSnippet> {
        snippet.id = Uuid::new_v4().to_string();
        snippet.created_at = chrono::Utc::now().to_rfc3339();
        snippet.updated_at = snippet.created_at.clone();
        snippet.usage_count = 0;
        
        self.save_snippet(&snippet)?;
        
        tracing::info!("Created snippet: {} ({})", snippet.name, snippet.id);
        Ok(snippet)
    }
    
    /// Update existing snippet
    pub fn update_snippet(&self, mut snippet: CodeSnippet) -> Result<CodeSnippet> {
        snippet.updated_at = chrono::Utc::now().to_rfc3339();
        self.save_snippet(&snippet)?;
        
        tracing::info!("Updated snippet: {} ({})", snippet.name, snippet.id);
        Ok(snippet)
    }
    
    /// Delete snippet
    pub fn delete_snippet(&self, snippet_id: &str) -> Result<()> {
        let mut snippets = self.load_all_snippets()?;
        snippets.retain(|s| s.id != snippet_id);
        self.save_all_snippets(&snippets)?;
        
        tracing::info!("Deleted snippet: {}", snippet_id);
        Ok(())
    }
    
    /// Get snippet by ID
    pub fn get_snippet(&self, snippet_id: &str) -> Result<Option<CodeSnippet>> {
        let snippets = self.load_all_snippets()?;
        Ok(snippets.into_iter().find(|s| s.id == snippet_id))
    }
    
    /// List all snippets
    pub fn list_snippets(&self) -> Result<Vec<CodeSnippet>> {
        self.load_all_snippets()
    }
    
    /// Search snippets
    pub fn search_snippets(&self, query: &str) -> Result<Vec<CodeSnippet>> {
        let snippets = self.load_all_snippets()?;
        let query_lower = query.to_lowercase();
        
        Ok(snippets.into_iter()
            .filter(|s| {
                s.name.to_lowercase().contains(&query_lower) ||
                s.description.to_lowercase().contains(&query_lower) ||
                s.tags.iter().any(|t| t.to_lowercase().contains(&query_lower)) ||
                s.code.to_lowercase().contains(&query_lower)
            })
            .collect())
    }
    
    /// Filter by category
    pub fn filter_by_category(&self, category: &SnippetCategory) -> Result<Vec<CodeSnippet>> {
        let snippets = self.load_all_snippets()?;
        Ok(snippets.into_iter()
            .filter(|s| &s.category == category)
            .collect())
    }
    
    /// Filter by language
    pub fn filter_by_language(&self, language: &str) -> Result<Vec<CodeSnippet>> {
        let snippets = self.load_all_snippets()?;
        Ok(snippets.into_iter()
            .filter(|s| s.language.eq_ignore_ascii_case(language))
            .collect())
    }
    
    /// Increment usage count
    pub fn increment_usage(&self, snippet_id: &str) -> Result<()> {
        if let Some(mut snippet) = self.get_snippet(snippet_id)? {
            snippet.usage_count += 1;
            self.update_snippet(snippet)?;
        }
        Ok(())
    }
    
    /// Get most used snippets
    pub fn get_most_used(&self, limit: usize) -> Result<Vec<CodeSnippet>> {
        let mut snippets = self.load_all_snippets()?;
        snippets.sort_by(|a, b| b.usage_count.cmp(&a.usage_count));
        Ok(snippets.into_iter().take(limit).collect())
    }
    
    /// Export snippets to file
    pub fn export_snippets(&self, path: &PathBuf) -> Result<()> {
        let snippets = self.load_all_snippets()?;
        let json = serde_json::to_string_pretty(&snippets)?;
        std::fs::write(path, json)?;
        
        tracing::info!("Exported {} snippets to {:?}", snippets.len(), path);
        Ok(())
    }
    
    /// Import snippets from file
    pub fn import_snippets(&self, path: &PathBuf, merge: bool) -> Result<usize> {
        let json = std::fs::read_to_string(path)?;
        let new_snippets: Vec<CodeSnippet> = serde_json::from_str(&json)?;
        
        let mut existing = if merge {
            self.load_all_snippets()?
        } else {
            Vec::new()
        };
        
        let count = new_snippets.len();
        existing.extend(new_snippets);
        
        self.save_all_snippets(&existing)?;
        
        tracing::info!("Imported {} snippets from {:?}", count, path);
        Ok(count)
    }
    
    // Private helper methods
    
    fn save_snippet(&self, snippet: &CodeSnippet) -> Result<()> {
        let mut snippets = self.load_all_snippets()?;
        
        // Remove existing if updating
        snippets.retain(|s| s.id != snippet.id);
        snippets.push(snippet.clone());
        
        self.save_all_snippets(&snippets)
    }
    
    fn load_all_snippets(&self) -> Result<Vec<CodeSnippet>> {
        let default_file = self.snippets_dir.join("default.json");
        
        if !default_file.exists() {
            return Ok(Vec::new());
        }
        
        let json = std::fs::read_to_string(&default_file)?;
        let snippets: Vec<CodeSnippet> = serde_json::from_str(&json)
            .unwrap_or_else(|_| Vec::new());
        
        Ok(snippets)
    }
    
    fn save_all_snippets(&self, snippets: &[CodeSnippet]) -> Result<()> {
        let default_file = self.snippets_dir.join("default.json");
        let json = serde_json::to_string_pretty(snippets)?;
        std::fs::write(&default_file, json)?;
        Ok(())
    }
    
    fn initialize_default_snippets(&mut self) -> Result<()> {
        let default_snippets = vec![
            // React snippets
            CodeSnippet {
                id: Uuid::new_v4().to_string(),
                name: "React Functional Component".to_string(),
                description: "Basic React functional component with TypeScript".to_string(),
                language: "typescript".to_string(),
                code: r#"import React from 'react';

interface ${1:ComponentName}Props {
  // Add props here
}

export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = (props) => {
  return (
    <div>
      {/* Component content */}
    </div>
  );
};"#.to_string(),
                prefix: "rfc".to_string(),
                tags: vec!["react".to_string(), "component".to_string(), "typescript".to_string()],
                category: SnippetCategory::React,
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: chrono::Utc::now().to_rfc3339(),
                usage_count: 0,
            },
            CodeSnippet {
                id: Uuid::new_v4().to_string(),
                name: "useState Hook".to_string(),
                description: "React useState hook".to_string(),
                language: "typescript".to_string(),
                code: "const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState<${2:type}>(${3:initialValue});".to_string(),
                prefix: "ust".to_string(),
                tags: vec!["react".to_string(), "hooks".to_string()],
                category: SnippetCategory::React,
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: chrono::Utc::now().to_rfc3339(),
                usage_count: 0,
            },
            // TypeScript snippets
            CodeSnippet {
                id: Uuid::new_v4().to_string(),
                name: "TypeScript Interface".to_string(),
                description: "TypeScript interface definition".to_string(),
                language: "typescript".to_string(),
                code: r#"interface ${1:InterfaceName} {
  ${2:property}: ${3:type};
}"#.to_string(),
                prefix: "int".to_string(),
                tags: vec!["typescript".to_string(), "interface".to_string()],
                category: SnippetCategory::TypeScript,
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: chrono::Utc::now().to_rfc3339(),
                usage_count: 0,
            },
            // Test snippets
            CodeSnippet {
                id: Uuid::new_v4().to_string(),
                name: "Jest Test Block".to_string(),
                description: "Jest describe and test block".to_string(),
                language: "typescript".to_string(),
                code: r#"describe('${1:TestSuite}', () => {
  it('should ${2:description}', () => {
    // Arrange
    ${3}
    
    // Act
    ${4}
    
    // Assert
    expect(${5}).toBe(${6});
  });
});"#.to_string(),
                prefix: "desc".to_string(),
                tags: vec!["test".to_string(), "jest".to_string()],
                category: SnippetCategory::Testing,
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: chrono::Utc::now().to_rfc3339(),
                usage_count: 0,
            },
            // Utility snippets
            CodeSnippet {
                id: Uuid::new_v4().to_string(),
                name: "Try-Catch Block".to_string(),
                description: "Try-catch error handling".to_string(),
                language: "typescript".to_string(),
                code: r#"try {
  ${1}
} catch (error) {
  console.error('${2:Error message}:', error);
  ${3}
}"#.to_string(),
                prefix: "try".to_string(),
                tags: vec!["error".to_string(), "handling".to_string()],
                category: SnippetCategory::Utility,
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: chrono::Utc::now().to_rfc3339(),
                usage_count: 0,
            },
            // Python snippets
            CodeSnippet {
                id: Uuid::new_v4().to_string(),
                name: "Python Function".to_string(),
                description: "Python function with type hints".to_string(),
                language: "python".to_string(),
                code: r#"def ${1:function_name}(${2:param}: ${3:type}) -> ${4:return_type}:
    """
    ${5:Description}
    
    Args:
        ${2:param}: ${6:parameter description}
    
    Returns:
        ${7:return description}
    """
    ${8:pass}"#.to_string(),
                prefix: "def".to_string(),
                tags: vec!["python".to_string(), "function".to_string()],
                category: SnippetCategory::Python,
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: chrono::Utc::now().to_rfc3339(),
                usage_count: 0,
            },
        ];
        
        self.save_all_snippets(&default_snippets)?;
        tracing::info!("Initialized {} default snippets", default_snippets.len());
        Ok(())
    }
}

// Tauri commands
#[tauri::command]
pub async fn create_snippet(snippet: CodeSnippet) -> Result<CodeSnippet, String> {
    let manager = SnippetManager::new().map_err(|e| e.to_string())?;
    manager.create_snippet(snippet).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_snippet(snippet: CodeSnippet) -> Result<CodeSnippet, String> {
    let manager = SnippetManager::new().map_err(|e| e.to_string())?;
    manager.update_snippet(snippet).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_snippet(snippet_id: String) -> Result<(), String> {
    let manager = SnippetManager::new().map_err(|e| e.to_string())?;
    manager.delete_snippet(&snippet_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_snippet(snippet_id: String) -> Result<Option<CodeSnippet>, String> {
    let manager = SnippetManager::new().map_err(|e| e.to_string())?;
    manager.get_snippet(&snippet_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_snippets() -> Result<Vec<CodeSnippet>, String> {
    let manager = SnippetManager::new().map_err(|e| e.to_string())?;
    manager.list_snippets().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_snippets(query: String) -> Result<Vec<CodeSnippet>, String> {
    let manager = SnippetManager::new().map_err(|e| e.to_string())?;
    manager.search_snippets(&query).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn filter_snippets_by_language(language: String) -> Result<Vec<CodeSnippet>, String> {
    let manager = SnippetManager::new().map_err(|e| e.to_string())?;
    manager.filter_by_language(&language).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn increment_snippet_usage(snippet_id: String) -> Result<(), String> {
    let manager = SnippetManager::new().map_err(|e| e.to_string())?;
    manager.increment_usage(&snippet_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_most_used_snippets(limit: usize) -> Result<Vec<CodeSnippet>, String> {
    let manager = SnippetManager::new().map_err(|e| e.to_string())?;
    manager.get_most_used(limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_snippets(path: String) -> Result<(), String> {
    let manager = SnippetManager::new().map_err(|e| e.to_string())?;
    manager.export_snippets(&PathBuf::from(path)).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_snippets(path: String, merge: bool) -> Result<usize, String> {
    let manager = SnippetManager::new().map_err(|e| e.to_string())?;
    manager.import_snippets(&PathBuf::from(path), merge).map_err(|e| e.to_string())
}
