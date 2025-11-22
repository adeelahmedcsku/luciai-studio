use rusqlite::{Connection, params, Result as SqlResult, OptionalExtension};
use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use std::path::PathBuf;
use chrono::Utc;

#[derive(Debug)]
pub struct Database {
    connection: Option<Connection>,
    db_path: PathBuf,
}

// Project history record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectHistory {
    pub id: i64,
    pub project_id: String,
    pub action: String,
    pub description: String,
    pub timestamp: String,
    pub user: String,
    pub changes: String, // JSON string
}

// Search index entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchIndex {
    pub id: i64,
    pub project_id: String,
    pub file_path: String,
    pub content: String,
    pub indexed_at: String,
}

// Usage statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStats {
    pub id: i64,
    pub feature: String,
    pub count: i64,
    pub last_used: String,
    pub total_time_seconds: i64,
}

// Bookmarks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bookmark {
    pub id: i64,
    pub project_id: String,
    pub file_path: String,
    pub line_number: Option<i32>,
    pub description: String,
    pub tags: String, // JSON array
    pub created_at: String,
}

// Sessions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceSession {
    pub id: i64,
    pub name: String,
    pub projects: String, // JSON array
    pub open_files: String, // JSON array
    pub state: String, // JSON object
    pub created_at: String,
    pub updated_at: String,
}

pub struct DatabaseManager {
    db_path: PathBuf,
}

impl DatabaseManager {
    pub fn new() -> Result<Self> {
        let app_dir = dirs::data_dir()
            .context("Failed to get data directory")?
            .join(".sai-ide");
        
        std::fs::create_dir_all(&app_dir)?;
        
        let db_path = app_dir.join("sai-ide.db");
        
        Ok(Self { db_path })
    }
    
    /// Initialize database with schema
    pub fn initialize(&self) -> Result<()> {
        let conn = Connection::open(&self.db_path)?;
        
        // Create tables
        conn.execute(
            "CREATE TABLE IF NOT EXISTS project_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT NOT NULL,
                action TEXT NOT NULL,
                description TEXT,
                timestamp TEXT NOT NULL,
                user TEXT,
                changes TEXT,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )",
            [],
        )?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS search_index (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT NOT NULL,
                file_path TEXT NOT NULL,
                content TEXT NOT NULL,
                indexed_at TEXT NOT NULL,
                UNIQUE(project_id, file_path)
            )",
            [],
        )?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS usage_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                feature TEXT NOT NULL UNIQUE,
                count INTEGER DEFAULT 0,
                last_used TEXT,
                total_time_seconds INTEGER DEFAULT 0
            )",
            [],
        )?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT NOT NULL,
                file_path TEXT NOT NULL,
                line_number INTEGER,
                description TEXT,
                tags TEXT,
                created_at TEXT NOT NULL
            )",
            [],
        )?;
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS workspace_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                projects TEXT NOT NULL,
                open_files TEXT NOT NULL,
                state TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;
        
        // Create indexes
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_history_project ON project_history(project_id)",
            [],
        )?;
        
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_search_project ON search_index(project_id)",
            [],
        )?;
        
        conn.execute(
            "CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
                project_id, file_path, content
            )",
            [],
        )?;
        
        tracing::info!("Database initialized successfully");
        Ok(())
    }
    
    // Project History Methods
    
    pub fn add_history(&self, history: &ProjectHistory) -> Result<i64> {
        let conn = Connection::open(&self.db_path)?;
        
        conn.execute(
            "INSERT INTO project_history (project_id, action, description, timestamp, user, changes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                history.project_id,
                history.action,
                history.description,
                history.timestamp,
                history.user,
                history.changes,
            ],
        )?;
        
        Ok(conn.last_insert_rowid())
    }
    
    pub fn get_project_history(&self, project_id: &str, limit: i32) -> Result<Vec<ProjectHistory>> {
        let conn = Connection::open(&self.db_path)?;
        
        let mut stmt = conn.prepare(
            "SELECT id, project_id, action, description, timestamp, user, changes
             FROM project_history
             WHERE project_id = ?1
             ORDER BY timestamp DESC
             LIMIT ?2"
        )?;
        
        let histories = stmt.query_map(params![project_id, limit], |row| {
            Ok(ProjectHistory {
                id: row.get(0)?,
                project_id: row.get(1)?,
                action: row.get(2)?,
                description: row.get(3)?,
                timestamp: row.get(4)?,
                user: row.get(5)?,
                changes: row.get(6)?,
            })
        })?
        .collect::<SqlResult<Vec<_>>>()?;
        
        Ok(histories)
    }
    
    // Search Index Methods
    
    pub fn index_file(&self, project_id: &str, file_path: &str, content: &str) -> Result<()> {
        let conn = Connection::open(&self.db_path)?;
        
        let now = Utc::now().to_rfc3339();
        
        // Update search_index table
        conn.execute(
            "INSERT OR REPLACE INTO search_index (project_id, file_path, content, indexed_at)
             VALUES (?1, ?2, ?3, ?4)",
            params![project_id, file_path, content, now],
        )?;
        
        // Update FTS index
        conn.execute(
            "INSERT OR REPLACE INTO search_fts (project_id, file_path, content)
             VALUES (?1, ?2, ?3)",
            params![project_id, file_path, content],
        )?;
        
        Ok(())
    }
    
    pub fn search_content(&self, query: &str, project_id: Option<&str>) -> Result<Vec<SearchIndex>> {
        let conn = Connection::open(&self.db_path)?;
        
        let sql = if let Some(pid) = project_id {
            format!(
                "SELECT id, project_id, file_path, content, indexed_at
                 FROM search_index
                 WHERE project_id = '{}' AND id IN (
                     SELECT rowid FROM search_fts WHERE search_fts MATCH '{}'
                 )
                 LIMIT 100",
                pid, query
            )
        } else {
            format!(
                "SELECT id, project_id, file_path, content, indexed_at
                 FROM search_index
                 WHERE id IN (
                     SELECT rowid FROM search_fts WHERE search_fts MATCH '{}'
                 )
                 LIMIT 100",
                query
            )
        };
        
        let mut stmt = conn.prepare(&sql)?;
        
        let results = stmt.query_map([], |row| {
            Ok(SearchIndex {
                id: row.get(0)?,
                project_id: row.get(1)?,
                file_path: row.get(2)?,
                content: row.get(3)?,
                indexed_at: row.get(4)?,
            })
        })?
        .collect::<SqlResult<Vec<_>>>()?;
        
        Ok(results)
    }
    
    // Usage Statistics Methods
    
    pub fn track_feature_usage(&self, feature: &str, duration_seconds: i64) -> Result<()> {
        let conn = Connection::open(&self.db_path)?;
        
        let now = Utc::now().to_rfc3339();
        
        conn.execute(
            "INSERT INTO usage_stats (feature, count, last_used, total_time_seconds)
             VALUES (?1, 1, ?2, ?3)
             ON CONFLICT(feature) DO UPDATE SET
                count = count + 1,
                last_used = ?2,
                total_time_seconds = total_time_seconds + ?3",
            params![feature, now, duration_seconds],
        )?;
        
        Ok(())
    }
    
    pub fn get_usage_stats(&self) -> Result<Vec<UsageStats>> {
        let conn = Connection::open(&self.db_path)?;
        
        let mut stmt = conn.prepare(
            "SELECT id, feature, count, last_used, total_time_seconds
             FROM usage_stats
             ORDER BY count DESC"
        )?;
        
        let stats = stmt.query_map([], |row| {
            Ok(UsageStats {
                id: row.get(0)?,
                feature: row.get(1)?,
                count: row.get(2)?,
                last_used: row.get(3)?,
                total_time_seconds: row.get(4)?,
            })
        })?
        .collect::<SqlResult<Vec<_>>>()?;
        
        Ok(stats)
    }
    
    // Bookmark Methods
    
    pub fn add_bookmark(&self, bookmark: &Bookmark) -> Result<i64> {
        let conn = Connection::open(&self.db_path)?;
        
        conn.execute(
            "INSERT INTO bookmarks (project_id, file_path, line_number, description, tags, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                bookmark.project_id,
                bookmark.file_path,
                bookmark.line_number,
                bookmark.description,
                bookmark.tags,
                bookmark.created_at,
            ],
        )?;
        
        Ok(conn.last_insert_rowid())
    }
    
    pub fn get_bookmarks(&self, project_id: Option<&str>) -> Result<Vec<Bookmark>> {
        let conn = Connection::open(&self.db_path)?;
        
        let (sql, params_vec): (String, Vec<&str>) = if let Some(pid) = project_id {
            (
                "SELECT id, project_id, file_path, line_number, description, tags, created_at
                 FROM bookmarks WHERE project_id = ?1 ORDER BY created_at DESC".to_string(),
                vec![pid],
            )
        } else {
            (
                "SELECT id, project_id, file_path, line_number, description, tags, created_at
                 FROM bookmarks ORDER BY created_at DESC".to_string(),
                vec![],
            )
        };
        
        let mut stmt = conn.prepare(&sql)?;
        
        let bookmarks = stmt.query_map(rusqlite::params_from_iter(params_vec), |row| {
            Ok(Bookmark {
                id: row.get(0)?,
                project_id: row.get(1)?,
                file_path: row.get(2)?,
                line_number: row.get(3)?,
                description: row.get(4)?,
                tags: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?
        .collect::<SqlResult<Vec<_>>>()?;
        
        Ok(bookmarks)
    }
    
    pub fn delete_bookmark(&self, bookmark_id: i64) -> Result<()> {
        let conn = Connection::open(&self.db_path)?;
        conn.execute("DELETE FROM bookmarks WHERE id = ?1", params![bookmark_id])?;
        Ok(())
    }
    
    // Session Methods
    
    pub fn save_session(&self, session: &WorkspaceSession) -> Result<i64> {
        let conn = Connection::open(&self.db_path)?;
        
        conn.execute(
            "INSERT OR REPLACE INTO workspace_sessions 
             (name, projects, open_files, state, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                session.name,
                session.projects,
                session.open_files,
                session.state,
                session.created_at,
                session.updated_at,
            ],
        )?;
        
        Ok(conn.last_insert_rowid())
    }
    
    pub fn load_session(&self, name: &str) -> Result<Option<WorkspaceSession>> {
        let conn = Connection::open(&self.db_path)?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, projects, open_files, state, created_at, updated_at
             FROM workspace_sessions WHERE name = ?1"
        )?;
        
        let session = stmt.query_row(params![name], |row| {
            Ok(WorkspaceSession {
                id: row.get(0)?,
                name: row.get(1)?,
                projects: row.get(2)?,
                open_files: row.get(3)?,
                state: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        }).optional()?;
        
        Ok(session)
    }
    
    pub fn list_sessions(&self) -> Result<Vec<WorkspaceSession>> {
        let conn = Connection::open(&self.db_path)?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, projects, open_files, state, created_at, updated_at
             FROM workspace_sessions ORDER BY updated_at DESC"
        )?;
        
        let sessions = stmt.query_map([], |row| {
            Ok(WorkspaceSession {
                id: row.get(0)?,
                name: row.get(1)?,
                projects: row.get(2)?,
                open_files: row.get(3)?,
                state: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?
        .collect::<SqlResult<Vec<_>>>()?;
        
        Ok(sessions)
    }
    
    pub fn delete_session(&self, name: &str) -> Result<()> {
        let conn = Connection::open(&self.db_path)?;
        conn.execute("DELETE FROM workspace_sessions WHERE name = ?1", params![name])?;
        Ok(())
    }
    
    // Utility methods
    
    pub fn vacuum(&self) -> Result<()> {
        let conn = Connection::open(&self.db_path)?;
        conn.execute("VACUUM", [])?;
        Ok(())
    }
    
    pub fn get_db_size(&self) -> Result<u64> {
        let metadata = std::fs::metadata(&self.db_path)?;
        Ok(metadata.len())
    }
}

// Tauri commands

#[tauri::command]
pub async fn init_database() -> Result<(), String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.initialize().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_project_history(history: ProjectHistory) -> Result<i64, String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.add_history(&history).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_project_history(project_id: String, limit: i32) -> Result<Vec<ProjectHistory>, String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.get_project_history(&project_id, limit).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn index_file_content(project_id: String, file_path: String, content: String) -> Result<(), String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.index_file(&project_id, &file_path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_indexed_content(query: String, project_id: Option<String>) -> Result<Vec<SearchIndex>, String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.search_content(&query, project_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn track_feature(feature: String, duration: i64) -> Result<(), String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.track_feature_usage(&feature, duration).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_usage_stats() -> Result<Vec<UsageStats>, String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.get_usage_stats().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_bookmark(bookmark: Bookmark) -> Result<i64, String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.add_bookmark(&bookmark).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_bookmarks(project_id: Option<String>) -> Result<Vec<Bookmark>, String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.get_bookmarks(project_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_bookmark(bookmark_id: i64) -> Result<(), String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.delete_bookmark(bookmark_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_workspace_session(session: WorkspaceSession) -> Result<i64, String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.save_session(&session).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn load_workspace_session(name: String) -> Result<Option<WorkspaceSession>, String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.load_session(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_workspace_sessions() -> Result<Vec<WorkspaceSession>, String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.list_sessions().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_workspace_session(name: String) -> Result<(), String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.delete_session(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_database_size() -> Result<u64, String> {
    let manager = DatabaseManager::new().map_err(|e| e.to_string())?;
    manager.get_db_size().map_err(|e| e.to_string())
}