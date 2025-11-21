use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub llm_metrics: LLMMetrics,
    pub project_metrics: ProjectMetrics,
    pub ide_metrics: IDEMetrics,
    pub resource_metrics: ResourceMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LLMMetrics {
    pub total_requests: u64,
    pub successful_requests: u64,
    pub failed_requests: u64,
    pub average_response_time_ms: f64,
    pub total_tokens_used: u64,
    pub total_cost: f64, // For paid APIs
    pub requests_by_model: HashMap<String, u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMetrics {
    pub projects_created: u64,
    pub projects_opened: u64,
    pub total_files_generated: u64,
    pub total_lines_generated: u64,
    pub average_generation_time_sec: f64,
    pub most_used_templates: Vec<(String, u64)>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IDEMetrics {
    pub session_duration_minutes: u64,
    pub files_opened: u64,
    pub files_edited: u64,
    pub files_saved: u64,
    pub commands_executed: u64,
    pub git_operations: u64,
    pub snippets_used: u64,
    pub shortcuts_used: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceMetrics {
    pub cpu_usage_percent: f32,
    pub memory_usage_mb: u64,
    pub disk_usage_mb: u64,
    pub network_requests: u64,
}

#[derive(Debug, Clone)]
pub struct PerformanceMonitor {
    start_time: Instant,
    llm_metrics: LLMMetrics,
    project_metrics: ProjectMetrics,
    ide_metrics: IDEMetrics,
}

impl Default for LLMMetrics {
    fn default() -> Self {
        Self {
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            average_response_time_ms: 0.0,
            total_tokens_used: 0,
            total_cost: 0.0,
            requests_by_model: HashMap::new(),
        }
    }
}

impl Default for ProjectMetrics {
    fn default() -> Self {
        Self {
            projects_created: 0,
            projects_opened: 0,
            total_files_generated: 0,
            total_lines_generated: 0,
            average_generation_time_sec: 0.0,
            most_used_templates: Vec::new(),
        }
    }
}

impl Default for IDEMetrics {
    fn default() -> Self {
        Self {
            session_duration_minutes: 0,
            files_opened: 0,
            files_edited: 0,
            files_saved: 0,
            commands_executed: 0,
            git_operations: 0,
            snippets_used: 0,
            shortcuts_used: 0,
        }
    }
}

impl PerformanceMonitor {
    pub fn new() -> Self {
        Self {
            start_time: Instant::now(),
            llm_metrics: LLMMetrics::default(),
            project_metrics: ProjectMetrics::default(),
            ide_metrics: IDEMetrics::default(),
        }
    }
    
    // LLM tracking
    pub fn track_llm_request(&mut self, model: &str, duration: Duration, tokens: u64, success: bool) {
        self.llm_metrics.total_requests += 1;
        
        if success {
            self.llm_metrics.successful_requests += 1;
        } else {
            self.llm_metrics.failed_requests += 1;
        }
        
        // Update average response time
        let total_time = self.llm_metrics.average_response_time_ms * (self.llm_metrics.total_requests - 1) as f64;
        self.llm_metrics.average_response_time_ms = (total_time + duration.as_millis() as f64) / self.llm_metrics.total_requests as f64;
        
        self.llm_metrics.total_tokens_used += tokens;
        
        *self.llm_metrics.requests_by_model.entry(model.to_string()).or_insert(0) += 1;
    }
    
    pub fn track_llm_cost(&mut self, cost: f64) {
        self.llm_metrics.total_cost += cost;
    }
    
    // Project tracking
    pub fn track_project_created(&mut self) {
        self.project_metrics.projects_created += 1;
    }
    
    pub fn track_project_opened(&mut self) {
        self.project_metrics.projects_opened += 1;
    }
    
    pub fn track_files_generated(&mut self, count: u64, lines: u64, duration: Duration) {
        self.project_metrics.total_files_generated += count;
        self.project_metrics.total_lines_generated += lines;
        
        // Update average generation time
        let total_projects = self.project_metrics.projects_created;
        if total_projects > 0 {
            let total_time = self.project_metrics.average_generation_time_sec * (total_projects - 1) as f64;
            self.project_metrics.average_generation_time_sec = (total_time + duration.as_secs_f64()) / total_projects as f64;
        }
    }
    
    pub fn track_template_used(&mut self, template: &str) {
        let entry = self.project_metrics.most_used_templates
            .iter_mut()
            .find(|(name, _)| name == template);
        
        if let Some((_, count)) = entry {
            *count += 1;
        } else {
            self.project_metrics.most_used_templates.push((template.to_string(), 1));
        }
        
        // Sort by usage
        self.project_metrics.most_used_templates.sort_by(|a, b| b.1.cmp(&a.1));
    }
    
    // IDE tracking
    pub fn track_file_opened(&mut self) {
        self.ide_metrics.files_opened += 1;
    }
    
    pub fn track_file_edited(&mut self) {
        self.ide_metrics.files_edited += 1;
    }
    
    pub fn track_file_saved(&mut self) {
        self.ide_metrics.files_saved += 1;
    }
    
    pub fn track_command_executed(&mut self) {
        self.ide_metrics.commands_executed += 1;
    }
    
    pub fn track_git_operation(&mut self) {
        self.ide_metrics.git_operations += 1;
    }
    
    pub fn track_snippet_used(&mut self) {
        self.ide_metrics.snippets_used += 1;
    }
    
    pub fn track_shortcut_used(&mut self) {
        self.ide_metrics.shortcuts_used += 1;
    }
    
    // Get metrics
    pub fn get_metrics(&self) -> PerformanceMetrics {
        let session_duration = self.start_time.elapsed().as_secs() / 60;
        
        let mut ide_metrics = self.ide_metrics.clone();
        ide_metrics.session_duration_minutes = session_duration;
        
        PerformanceMetrics {
            llm_metrics: self.llm_metrics.clone(),
            project_metrics: self.project_metrics.clone(),
            ide_metrics,
            resource_metrics: ResourceMetrics::current(),
        }
    }
    
    // Reset metrics
    pub fn reset(&mut self) {
        self.start_time = Instant::now();
        self.llm_metrics = LLMMetrics::default();
        self.project_metrics = ProjectMetrics::default();
        self.ide_metrics = IDEMetrics::default();
    }
}

impl ResourceMetrics {
    pub fn current() -> Self {
        // Get current system resource usage
        let cpu_usage = Self::get_cpu_usage();
        let memory_usage = Self::get_memory_usage();
        
        Self {
            cpu_usage_percent: cpu_usage,
            memory_usage_mb: memory_usage,
            disk_usage_mb: 0, // TODO: Calculate actual disk usage
            network_requests: 0,
        }
    }
    
    fn get_cpu_usage() -> f32 {
        // Simplified CPU usage
        // TODO: Implement actual CPU monitoring
        0.0
    }
    
    fn get_memory_usage() -> u64 {
        // Simplified memory usage
        // TODO: Implement actual memory monitoring
        0
    }
}

// Global performance monitor (singleton)
static mut PERFORMANCE_MONITOR: Option<PerformanceMonitor> = None;

pub fn get_monitor() -> &'static mut PerformanceMonitor {
    unsafe {
        if PERFORMANCE_MONITOR.is_none() {
            PERFORMANCE_MONITOR = Some(PerformanceMonitor::new());
        }
        PERFORMANCE_MONITOR.as_mut().unwrap()
    }
}

// Tauri commands
#[tauri::command]
pub async fn get_performance_metrics() -> Result<PerformanceMetrics, String> {
    Ok(get_monitor().get_metrics())
}

#[tauri::command]
pub async fn reset_performance_metrics() -> Result<(), String> {
    get_monitor().reset();
    Ok(())
}

#[tauri::command]
pub async fn track_llm_request_perf(
    model: String,
    duration_ms: u64,
    tokens: u64,
    success: bool,
) -> Result<(), String> {
    get_monitor().track_llm_request(
        &model,
        Duration::from_millis(duration_ms),
        tokens,
        success,
    );
    Ok(())
}

#[tauri::command]
pub async fn track_project_generation_perf(
    files: u64,
    lines: u64,
    duration_sec: u64,
) -> Result<(), String> {
    get_monitor().track_files_generated(
        files,
        lines,
        Duration::from_secs(duration_sec),
    );
    Ok(())
}

#[tauri::command]
pub async fn track_ide_action(action: String) -> Result<(), String> {
    let monitor = get_monitor();
    
    match action.as_str() {
        "file_opened" => monitor.track_file_opened(),
        "file_edited" => monitor.track_file_edited(),
        "file_saved" => monitor.track_file_saved(),
        "command_executed" => monitor.track_command_executed(),
        "git_operation" => monitor.track_git_operation(),
        "snippet_used" => monitor.track_snippet_used(),
        "shortcut_used" => monitor.track_shortcut_used(),
        _ => {}
    }
    
    Ok(())
}
