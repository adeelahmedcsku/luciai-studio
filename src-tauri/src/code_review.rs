use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeReview {
    pub id: String,
    pub project_id: String,
    pub files: Vec<String>,
    pub status: ReviewStatus,
    pub created_at: String,
    pub updated_at: String,
    pub reviewer: String,
    pub findings: Vec<ReviewFinding>,
    pub metrics: CodeMetrics,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ReviewStatus {
    InProgress,
    Completed,
    Approved,
    ChangesRequested,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewFinding {
    pub id: String,
    pub file_path: String,
    pub line_number: Option<u32>,
    pub severity: Severity,
    pub category: FindingCategory,
    pub message: String,
    pub suggestion: Option<String>,
    pub resolved: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Severity {
    Critical,
    High,
    Medium,
    Low,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FindingCategory {
    Security,
    Performance,
    BugRisk,
    CodeStyle,
    BestPractice,
    Documentation,
    Testing,
    Complexity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeMetrics {
    pub total_lines: u32,
    pub code_lines: u32,
    pub comment_lines: u32,
    pub blank_lines: u32,
    pub complexity: u32,
    pub maintainability_index: f32,
    pub test_coverage: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewComment {
    pub id: String,
    pub review_id: String,
    pub file_path: String,
    pub line_number: u32,
    pub author: String,
    pub content: String,
    pub created_at: String,
    pub resolved: bool,
}

pub struct CodeReviewEngine {
    llm_client: crate::llm::OllamaClient,
}

impl CodeReviewEngine {
    pub fn new() -> Result<Self> {
        Ok(Self {
            llm_client: crate::llm::OllamaClient::new(
                "http://localhost:11434",
                "deepseek-coder-v2:16b"
            )?,
        })
    }
    
    /// Perform AI-powered code review
    pub async fn review_code(&self, file_path: &PathBuf, content: &str) -> Result<Vec<ReviewFinding>> {
        let prompt = format!(
            r#"You are an expert code reviewer. Review the following code and identify issues.

File: {}

Code:
```
{}
```

Analyze for:
1. Security vulnerabilities
2. Performance issues
3. Potential bugs
4. Code style violations
5. Best practice violations
6. Missing documentation
7. Missing tests
8. High complexity

For each issue found, provide:
- Severity (Critical/High/Medium/Low/Info)
- Category
- Line number (if applicable)
- Description
- Suggested fix

Format as JSON array:
[
  {{
    "severity": "High",
    "category": "Security",
    "line": 42,
    "message": "SQL injection vulnerability",
    "suggestion": "Use parameterized queries"
  }}
]"#,
            file_path.display(),
            content
        );
        
        let response = self.llm_client.generate(prompt, None).await?;
        
        // Parse LLM response
        let findings = self.parse_review_response(&response, file_path)?;
        
        Ok(findings)
    }
    
    /// Calculate code metrics
    pub fn calculate_metrics(&self, content: &str) -> CodeMetrics {
        let lines: Vec<&str> = content.lines().collect();
        let total_lines = lines.len() as u32;
        
        let mut code_lines = 0;
        let mut comment_lines = 0;
        let mut blank_lines = 0;
        
        for line in &lines {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                blank_lines += 1;
            } else if trimmed.starts_with("//") || trimmed.starts_with("#") || 
                      trimmed.starts_with("/*") || trimmed.starts_with("*") {
                comment_lines += 1;
            } else {
                code_lines += 1;
            }
        }
        
        let complexity = self.calculate_complexity(content);
        let maintainability = self.calculate_maintainability(code_lines, complexity);
        
        CodeMetrics {
            total_lines,
            code_lines,
            comment_lines,
            blank_lines,
            complexity,
            maintainability_index: maintainability,
            test_coverage: None,
        }
    }
    
    /// Calculate cyclomatic complexity
    fn calculate_complexity(&self, content: &str) -> u32 {
        let mut complexity = 1; // Base complexity
        
        // Count decision points
        let keywords = ["if", "else", "for", "while", "case", "catch", "&&", "||", "?"];
        
        for keyword in keywords {
            complexity += content.matches(keyword).count() as u32;
        }
        
        complexity
    }
    
    /// Calculate maintainability index
    fn calculate_maintainability(&self, code_lines: u32, complexity: u32) -> f32 {
        // Simplified maintainability index
        // Real formula: 171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code)
        
        let volume = code_lines as f32 * 1.5; // Simplified Halstead volume
        let mi = 171.0 - 5.2 * volume.ln() - 0.23 * (complexity as f32) - 16.2 * (code_lines as f32).ln();
        
        mi.max(0.0).min(100.0)
    }
    
    /// Check for security issues
    pub fn check_security(&self, content: &str) -> Vec<ReviewFinding> {
        let mut findings = Vec::new();
        
        // Check for common security issues
        let security_patterns = vec![
            ("eval(", "Avoid using eval() - security risk"),
            ("innerHTML", "innerHTML can lead to XSS - use textContent"),
            ("dangerouslySetInnerHTML", "Dangerous HTML injection - sanitize input"),
            ("SELECT * FROM", "Avoid SELECT * - specify columns explicitly"),
            ("password", "Password in code - use environment variables"),
            ("api_key", "API key in code - use secure storage"),
            ("exec(", "exec() can be dangerous - validate input"),
            ("shell=True", "Shell injection risk - use subprocess safely"),
        ];
        
        for (line_num, line) in content.lines().enumerate() {
            for (pattern, message) in &security_patterns {
                if line.contains(pattern) {
                    findings.push(ReviewFinding {
                        id: uuid::Uuid::new_v4().to_string(),
                        file_path: String::new(),
                        line_number: Some((line_num + 1) as u32),
                        severity: Severity::High,
                        category: FindingCategory::Security,
                        message: message.to_string(),
                        suggestion: Some(format!("Review usage of {}", pattern)),
                        resolved: false,
                    });
                }
            }
        }
        
        findings
    }
    
    /// Check for performance issues
    pub fn check_performance(&self, content: &str) -> Vec<ReviewFinding> {
        let mut findings = Vec::new();
        
        let performance_patterns = vec![
            ("for (", "Consider using map/filter/reduce for better readability"),
            ("setTimeout(", "Ensure proper cleanup of timers"),
            ("setInterval(", "Memory leak risk - clear interval when done"),
            ("console.log(", "Remove console.log in production"),
            ("JSON.parse(JSON.stringify", "Inefficient deep clone - use library"),
        ];
        
        for (line_num, line) in content.lines().enumerate() {
            for (pattern, message) in &performance_patterns {
                if line.contains(pattern) {
                    findings.push(ReviewFinding {
                        id: uuid::Uuid::new_v4().to_string(),
                        file_path: String::new(),
                        line_number: Some((line_num + 1) as u32),
                        severity: Severity::Medium,
                        category: FindingCategory::Performance,
                        message: message.to_string(),
                        suggestion: None,
                        resolved: false,
                    });
                }
            }
        }
        
        findings
    }
    
    /// Generate review report
    pub fn generate_report(&self, review: &CodeReview) -> String {
        let mut report = String::new();
        
        report.push_str(&format!("# Code Review Report\n\n"));
        report.push_str(&format!("**Project:** {}\n", review.project_id));
        report.push_str(&format!("**Status:** {:?}\n", review.status));
        report.push_str(&format!("**Reviewer:** {}\n", review.reviewer));
        report.push_str(&format!("**Date:** {}\n\n", review.created_at));
        
        report.push_str("## Metrics\n\n");
        report.push_str(&format!("- Total Lines: {}\n", review.metrics.total_lines));
        report.push_str(&format!("- Code Lines: {}\n", review.metrics.code_lines));
        report.push_str(&format!("- Complexity: {}\n", review.metrics.complexity));
        report.push_str(&format!("- Maintainability: {:.1}\n\n", review.metrics.maintainability_index));
        
        report.push_str("## Findings\n\n");
        
        // Group by severity
        let critical: Vec<_> = review.findings.iter().filter(|f| f.severity == Severity::Critical).collect();
        let high: Vec<_> = review.findings.iter().filter(|f| f.severity == Severity::High).collect();
        let medium: Vec<_> = review.findings.iter().filter(|f| f.severity == Severity::Medium).collect();
        let low: Vec<_> = review.findings.iter().filter(|f| f.severity == Severity::Low).collect();
        
        if !critical.is_empty() {
            report.push_str(&format!("### Critical Issues ({})\n\n", critical.len()));
            for finding in critical {
                report.push_str(&self.format_finding(finding));
            }
        }
        
        if !high.is_empty() {
            report.push_str(&format!("### High Priority ({})\n\n", high.len()));
            for finding in high {
                report.push_str(&self.format_finding(finding));
            }
        }
        
        if !medium.is_empty() {
            report.push_str(&format!("### Medium Priority ({})\n\n", medium.len()));
            for finding in medium {
                report.push_str(&self.format_finding(finding));
            }
        }
        
        if !low.is_empty() {
            report.push_str(&format!("### Low Priority ({})\n\n", low.len()));
            for finding in low {
                report.push_str(&self.format_finding(finding));
            }
        }
        
        report
    }
    
    fn format_finding(&self, finding: &ReviewFinding) -> String {
        let mut text = String::new();
        
        text.push_str(&format!("- **{:?}** | {:?}\n", finding.severity, finding.category));
        text.push_str(&format!("  - File: {}\n", finding.file_path));
        if let Some(line) = finding.line_number {
            text.push_str(&format!("  - Line: {}\n", line));
        }
        text.push_str(&format!("  - Issue: {}\n", finding.message));
        if let Some(suggestion) = &finding.suggestion {
            text.push_str(&format!("  - Fix: {}\n", suggestion));
        }
        text.push_str("\n");
        
        text
    }
    
    fn parse_review_response(&self, response: &str, file_path: &PathBuf) -> Result<Vec<ReviewFinding>> {
        // Try to parse JSON response from LLM
        let mut findings = Vec::new();
        
        // Simple parsing - in production would be more robust
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(response) {
            if let Some(array) = json.as_array() {
                for item in array {
                    if let Some(obj) = item.as_object() {
                        let severity = match obj.get("severity").and_then(|v| v.as_str()) {
                            Some("Critical") => Severity::Critical,
                            Some("High") => Severity::High,
                            Some("Medium") => Severity::Medium,
                            Some("Low") => Severity::Low,
                            _ => Severity::Info,
                        };
                        
                        let category = match obj.get("category").and_then(|v| v.as_str()) {
                            Some("Security") => FindingCategory::Security,
                            Some("Performance") => FindingCategory::Performance,
                            Some("BugRisk") => FindingCategory::BugRisk,
                            Some("CodeStyle") => FindingCategory::CodeStyle,
                            _ => FindingCategory::BestPractice,
                        };
                        
                        findings.push(ReviewFinding {
                            id: uuid::Uuid::new_v4().to_string(),
                            file_path: file_path.to_string_lossy().to_string(),
                            line_number: obj.get("line").and_then(|v| v.as_u64()).map(|n| n as u32),
                            severity,
                            category,
                            message: obj.get("message").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                            suggestion: obj.get("suggestion").and_then(|v| v.as_str()).map(|s| s.to_string()),
                            resolved: false,
                        });
                    }
                }
            }
        }
        
        Ok(findings)
    }
}

// Tauri commands

#[tauri::command]
pub async fn review_file(file_path: String, content: String) -> Result<Vec<ReviewFinding>, String> {
    let engine = CodeReviewEngine::new().map_err(|e| e.to_string())?;
    
    // Combine AI review with static analysis
    let mut findings = Vec::new();
    
    // Static analysis
    findings.extend(engine.check_security(&content));
    findings.extend(engine.check_performance(&content));
    
    // AI review (if LLM available)
    if let Ok(ai_findings) = engine.review_code(&PathBuf::from(&file_path), &content).await {
        findings.extend(ai_findings);
    }
    
    Ok(findings)
}

#[tauri::command]
pub async fn calculate_code_metrics(content: String) -> Result<CodeMetrics, String> {
    let engine = CodeReviewEngine::new().map_err(|e| e.to_string())?;
    Ok(engine.calculate_metrics(&content))
}

#[tauri::command]
pub async fn generate_review_report(review: CodeReview) -> Result<String, String> {
    let engine = CodeReviewEngine::new().map_err(|e| e.to_string())?;
    Ok(engine.generate_report(&review))
}

#[tauri::command]
pub async fn check_file_security(content: String) -> Result<Vec<ReviewFinding>, String> {
    let engine = CodeReviewEngine::new().map_err(|e| e.to_string())?;
    Ok(engine.check_security(&content))
}

#[tauri::command]
pub async fn check_file_performance(content: String) -> Result<Vec<ReviewFinding>, String> {
    let engine = CodeReviewEngine::new().map_err(|e| e.to_string())?;
    Ok(engine.check_performance(&content))
}
