use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::time::{Duration, Instant};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileSession {
    pub id: String,
    pub name: String,
    pub started_at: String,
    pub duration: u64,
    pub samples: Vec<ProfileSample>,
    pub metrics: PerformanceMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileSample {
    pub timestamp: u64,
    pub cpu_usage: f32,
    pub memory_usage: u64,
    pub function_name: Option<String>,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub total_time: u64,
    pub cpu_avg: f32,
    pub cpu_max: f32,
    pub memory_avg: u64,
    pub memory_max: u64,
    pub memory_min: u64,
    pub function_calls: HashMap<String, FunctionMetrics>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionMetrics {
    pub name: String,
    pub call_count: u64,
    pub total_time: u64,
    pub avg_time: u64,
    pub max_time: u64,
    pub min_time: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemorySnapshot {
    pub timestamp: String,
    pub heap_used: u64,
    pub heap_total: u64,
    pub external: u64,
    pub rss: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CPUProfile {
    pub samples: Vec<CPUSample>,
    pub top_functions: Vec<FunctionMetrics>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CPUSample {
    pub timestamp: u64,
    pub usage: f32,
}

pub struct PerformanceProfiler {
    sessions: HashMap<String, ProfileSession>,
    current_session: Option<String>,
    start_time: Option<Instant>,
}

impl PerformanceProfiler {
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
            current_session: None,
            start_time: None,
        }
    }
    
    pub fn start_profiling(&mut self, name: String) -> String {
        let session_id = uuid::Uuid::new_v4().to_string();
        let session = ProfileSession {
            id: session_id.clone(),
            name,
            started_at: chrono::Utc::now().to_rfc3339(),
            duration: 0,
            samples: Vec::new(),
            metrics: PerformanceMetrics {
                total_time: 0,
                cpu_avg: 0.0,
                cpu_max: 0.0,
                memory_avg: 0,
                memory_max: 0,
                memory_min: u64::MAX,
                function_calls: HashMap::new(),
            },
        };
        
        self.sessions.insert(session_id.clone(), session);
        self.current_session = Some(session_id.clone());
        self.start_time = Some(Instant::now());
        
        session_id
    }
    
    pub fn stop_profiling(&mut self) -> Result<ProfileSession> {
        if let Some(session_id) = &self.current_session {
            if let Some(session) = self.sessions.get_mut(session_id) {
                if let Some(start) = self.start_time {
                    session.duration = start.elapsed().as_millis() as u64;
                }
                
                // Calculate metrics
                self.calculate_metrics(session);
                
                let result = session.clone();
                self.current_session = None;
                self.start_time = None;
                
                return Ok(result);
            }
        }
        
        anyhow::bail!("No active profiling session")
    }
    
    pub fn add_sample(&mut self, cpu_usage: f32, memory_usage: u64) -> Result<()> {
        if let Some(session_id) = &self.current_session {
            if let Some(session) = self.sessions.get_mut(session_id) {
                let timestamp = if let Some(start) = self.start_time {
                    start.elapsed().as_millis() as u64
                } else {
                    0
                };
                
                let sample = ProfileSample {
                    timestamp,
                    cpu_usage,
                    memory_usage,
                    function_name: None,
                    duration_ms: 0,
                };
                
                session.samples.push(sample);
            }
        }
        Ok(())
    }
    
    pub fn record_function_call(&mut self, function_name: String, duration_ms: u64) -> Result<()> {
        if let Some(session_id) = &self.current_session {
            if let Some(session) = self.sessions.get_mut(session_id) {
                let metrics = session.metrics.function_calls
                    .entry(function_name.clone())
                    .or_insert(FunctionMetrics {
                        name: function_name.clone(),
                        call_count: 0,
                        total_time: 0,
                        avg_time: 0,
                        max_time: 0,
                        min_time: u64::MAX,
                    });
                
                metrics.call_count += 1;
                metrics.total_time += duration_ms;
                metrics.avg_time = metrics.total_time / metrics.call_count;
                metrics.max_time = metrics.max_time.max(duration_ms);
                metrics.min_time = metrics.min_time.min(duration_ms);
            }
        }
        Ok(())
    }
    
    fn calculate_metrics(&self, session: &mut ProfileSession) {
        if session.samples.is_empty() {
            return;
        }
        
        let mut cpu_sum = 0.0;
        let mut memory_sum = 0u64;
        
        for sample in &session.samples {
            cpu_sum += sample.cpu_usage;
            memory_sum += sample.memory_usage;
            
            session.metrics.cpu_max = session.metrics.cpu_max.max(sample.cpu_usage);
            session.metrics.memory_max = session.metrics.memory_max.max(sample.memory_usage);
            session.metrics.memory_min = session.metrics.memory_min.min(sample.memory_usage);
        }
        
        session.metrics.cpu_avg = cpu_sum / session.samples.len() as f32;
        session.metrics.memory_avg = memory_sum / session.samples.len() as u64;
        session.metrics.total_time = session.duration;
    }
    
    pub fn get_session(&self, session_id: &str) -> Option<&ProfileSession> {
        self.sessions.get(session_id)
    }
    
    pub fn list_sessions(&self) -> Vec<ProfileSession> {
        self.sessions.values().cloned().collect()
    }
    
    pub fn generate_report(&self, session_id: &str) -> Result<String> {
        let session = self.sessions.get(session_id)
            .ok_or_else(|| anyhow::anyhow!("Session not found"))?;
        
        let mut report = String::new();
        
        report.push_str("# Performance Profile Report\n\n");
        report.push_str(&format!("**Session:** {}\n", session.name));
        report.push_str(&format!("**Duration:** {}ms\n", session.duration));
        report.push_str(&format!("**Samples:** {}\n\n", session.samples.len()));
        
        report.push_str("## CPU Metrics\n\n");
        report.push_str(&format!("- Average: {:.2}%\n", session.metrics.cpu_avg));
        report.push_str(&format!("- Maximum: {:.2}%\n\n", session.metrics.cpu_max));
        
        report.push_str("## Memory Metrics\n\n");
        report.push_str(&format!("- Average: {} MB\n", session.metrics.memory_avg / 1024 / 1024));
        report.push_str(&format!("- Maximum: {} MB\n", session.metrics.memory_max / 1024 / 1024));
        report.push_str(&format!("- Minimum: {} MB\n\n", session.metrics.memory_min / 1024 / 1024));
        
        if !session.metrics.function_calls.is_empty() {
            report.push_str("## Top Functions\n\n");
            
            let mut functions: Vec<_> = session.metrics.function_calls.values().collect();
            functions.sort_by(|a, b| b.total_time.cmp(&a.total_time));
            
            for (i, func) in functions.iter().take(10).enumerate() {
                report.push_str(&format!("{}. **{}**\n", i + 1, func.name));
                report.push_str(&format!("   - Calls: {}\n", func.call_count));
                report.push_str(&format!("   - Total: {}ms\n", func.total_time));
                report.push_str(&format!("   - Average: {}ms\n", func.avg_time));
                report.push_str(&format!("   - Max: {}ms\n\n", func.max_time));
            }
        }
        
        Ok(report)
    }
    
    pub fn get_memory_snapshot(&self) -> MemorySnapshot {
        // In a real implementation, this would use system APIs
        MemorySnapshot {
            timestamp: chrono::Utc::now().to_rfc3339(),
            heap_used: 0,
            heap_total: 0,
            external: 0,
            rss: 0,
        }
    }
    
    pub fn get_cpu_profile(&self, session_id: &str) -> Result<CPUProfile> {
        let session = self.sessions.get(session_id)
            .ok_or_else(|| anyhow::anyhow!("Session not found"))?;
        
        let samples: Vec<CPUSample> = session.samples.iter().map(|s| CPUSample {
            timestamp: s.timestamp,
            usage: s.cpu_usage,
        }).collect();
        
        let mut top_functions: Vec<_> = session.metrics.function_calls.values().cloned().collect();
        top_functions.sort_by(|a, b| b.total_time.cmp(&a.total_time));
        top_functions.truncate(10);
        
        Ok(CPUProfile {
            samples,
            top_functions,
        })
    }
}

// Global instance
static mut PROFILER: Option<PerformanceProfiler> = None;

fn get_profiler() -> &'static mut PerformanceProfiler {
    unsafe {
        if PROFILER.is_none() {
            PROFILER = Some(PerformanceProfiler::new());
        }
        PROFILER.as_mut().unwrap()
    }
}

// Tauri commands

#[tauri::command]
pub async fn start_performance_profiling(name: String) -> Result<String, String> {
    Ok(get_profiler().start_profiling(name))
}

#[tauri::command]
pub async fn stop_performance_profiling() -> Result<ProfileSession, String> {
    get_profiler().stop_profiling().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_performance_sample(cpu_usage: f32, memory_usage: u64) -> Result<(), String> {
    get_profiler().add_sample(cpu_usage, memory_usage).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn record_function_performance(function_name: String, duration_ms: u64) -> Result<(), String> {
    get_profiler().record_function_call(function_name, duration_ms).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_profile_session(session_id: String) -> Result<Option<ProfileSession>, String> {
    Ok(get_profiler().get_session(&session_id).cloned())
}

#[tauri::command]
pub async fn list_profile_sessions() -> Result<Vec<ProfileSession>, String> {
    Ok(get_profiler().list_sessions())
}

#[tauri::command]
pub async fn generate_performance_report(session_id: String) -> Result<String, String> {
    get_profiler().generate_report(&session_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_current_memory_snapshot() -> Result<MemorySnapshot, String> {
    Ok(get_profiler().get_memory_snapshot())
}

#[tauri::command]
pub async fn get_session_cpu_profile(session_id: String) -> Result<CPUProfile, String> {
    get_profiler().get_cpu_profile(&session_id).map_err(|e| e.to_string())
}
