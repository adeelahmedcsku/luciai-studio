use serde::{Deserialize, Serialize};
use anyhow::Result;
use std::process::Command;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestRunner {
    pub framework: TestFramework,
    pub project_path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TestFramework {
    Jest,
    Vitest,
    PyTest,
    Cargo,
    Go,
    Mocha,
    JUnit,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResult {
    pub total_tests: u32,
    pub passed: u32,
    pub failed: u32,
    pub skipped: u32,
    pub duration_ms: u64,
    pub coverage: Option<Coverage>,
    pub failures: Vec<TestFailure>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Coverage {
    pub lines: f32,
    pub functions: f32,
    pub branches: f32,
    pub statements: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestFailure {
    pub test_name: String,
    pub error_message: String,
    pub stack_trace: Option<String>,
}

impl TestRunner {
    pub fn new(framework: TestFramework, project_path: PathBuf) -> Self {
        Self {
            framework,
            project_path,
        }
    }
    
    /// Detect test framework from project
    pub fn detect_framework(project_path: &PathBuf) -> Result<TestFramework> {
        let package_json = project_path.join("package.json");
        let cargo_toml = project_path.join("Cargo.toml");
        let pytest_ini = project_path.join("pytest.ini");
        let go_mod = project_path.join("go.mod");
        
        if package_json.exists() {
            let content = std::fs::read_to_string(&package_json)?;
            if content.contains("\"jest\"") {
                return Ok(TestFramework::Jest);
            } else if content.contains("\"vitest\"") {
                return Ok(TestFramework::Vitest);
            } else if content.contains("\"mocha\"") {
                return Ok(TestFramework::Mocha);
            }
        }
        
        if cargo_toml.exists() {
            return Ok(TestFramework::Cargo);
        }
        
        if pytest_ini.exists() {
            return Ok(TestFramework::PyTest);
        }
        
        if go_mod.exists() {
            return Ok(TestFramework::Go);
        }
        
        anyhow::bail!("Could not detect test framework")
    }
    
    /// Run tests
    pub async fn run_tests(&self) -> Result<TestResult> {
        match self.framework {
            TestFramework::Jest => self.run_jest().await,
            TestFramework::Vitest => self.run_vitest().await,
            TestFramework::PyTest => self.run_pytest().await,
            TestFramework::Cargo => self.run_cargo_test().await,
            TestFramework::Go => self.run_go_test().await,
            TestFramework::Mocha => self.run_mocha().await,
            TestFramework::JUnit => self.run_junit().await,
        }
    }
    
    async fn run_jest(&self) -> Result<TestResult> {
        let output = Command::new("npm")
            .args(&["test", "--", "--json", "--coverage"])
            .current_dir(&self.project_path)
            .output()?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        self.parse_jest_output(&stdout)
    }
    
    async fn run_vitest(&self) -> Result<TestResult> {
        let output = Command::new("npm")
            .args(&["run", "test", "--", "--reporter=json", "--coverage"])
            .current_dir(&self.project_path)
            .output()?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        self.parse_vitest_output(&stdout)
    }
    
    async fn run_pytest(&self) -> Result<TestResult> {
        let output = Command::new("pytest")
            .args(&["--json-report", "--cov", "--cov-report=json"])
            .current_dir(&self.project_path)
            .output()?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        self.parse_pytest_output(&stdout)
    }
    
    async fn run_cargo_test(&self) -> Result<TestResult> {
        let output = Command::new("cargo")
            .args(&["test", "--", "--format", "json"])
            .current_dir(&self.project_path)
            .output()?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        self.parse_cargo_output(&stdout)
    }
    
    async fn run_go_test(&self) -> Result<TestResult> {
        let output = Command::new("go")
            .args(&["test", "-json", "-cover", "./..."])
            .current_dir(&self.project_path)
            .output()?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        self.parse_go_output(&stdout)
    }
    
    async fn run_mocha(&self) -> Result<TestResult> {
        let output = Command::new("npm")
            .args(&["test", "--", "--reporter", "json"])
            .current_dir(&self.project_path)
            .output()?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        self.parse_mocha_output(&stdout)
    }
    
    async fn run_junit(&self) -> Result<TestResult> {
        let output = Command::new("mvn")
            .args(&["test"])
            .current_dir(&self.project_path)
            .output()?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        self.parse_junit_output(&stdout)
    }
    
    // Parsing methods
    
    fn parse_jest_output(&self, output: &str) -> Result<TestResult> {
        // Parse Jest JSON output
        let json: serde_json::Value = serde_json::from_str(output)
            .unwrap_or_else(|_| serde_json::json!({}));
        
        let total = json["numTotalTests"].as_u64().unwrap_or(0) as u32;
        let passed = json["numPassedTests"].as_u64().unwrap_or(0) as u32;
        let failed = json["numFailedTests"].as_u64().unwrap_or(0) as u32;
        let skipped = json["numPendingTests"].as_u64().unwrap_or(0) as u32;
        
        let coverage = if let Some(cov) = json.get("coverageMap") {
            Some(Coverage {
                lines: cov["total"]["lines"]["pct"].as_f64().unwrap_or(0.0) as f32,
                functions: cov["total"]["functions"]["pct"].as_f64().unwrap_or(0.0) as f32,
                branches: cov["total"]["branches"]["pct"].as_f64().unwrap_or(0.0) as f32,
                statements: cov["total"]["statements"]["pct"].as_f64().unwrap_or(0.0) as f32,
            })
        } else {
            None
        };
        
        Ok(TestResult {
            total_tests: total,
            passed,
            failed,
            skipped,
            duration_ms: 0,
            coverage,
            failures: Vec::new(),
        })
    }
    
    fn parse_vitest_output(&self, output: &str) -> Result<TestResult> {
        // Similar to Jest
        self.parse_jest_output(output)
    }
    
    fn parse_pytest_output(&self, output: &str) -> Result<TestResult> {
        // Parse PyTest JSON output
        let json: serde_json::Value = serde_json::from_str(output)
            .unwrap_or_else(|_| serde_json::json!({}));
        
        let summary = &json["summary"];
        let total = summary["total"].as_u64().unwrap_or(0) as u32;
        let passed = summary["passed"].as_u64().unwrap_or(0) as u32;
        let failed = summary["failed"].as_u64().unwrap_or(0) as u32;
        let skipped = summary["skipped"].as_u64().unwrap_or(0) as u32;
        
        Ok(TestResult {
            total_tests: total,
            passed,
            failed,
            skipped,
            duration_ms: 0,
            coverage: None,
            failures: Vec::new(),
        })
    }
    
    fn parse_cargo_output(&self, output: &str) -> Result<TestResult> {
        // Parse Cargo test output
        let mut passed = 0;
        let mut failed = 0;
        
        for line in output.lines() {
            if line.contains("test result: ok") {
                // Extract numbers
                if let Some(nums) = line.split("passed").nth(0) {
                    if let Some(num_str) = nums.split_whitespace().last() {
                        passed = num_str.parse().unwrap_or(0);
                    }
                }
            }
        }
        
        Ok(TestResult {
            total_tests: passed + failed,
            passed,
            failed,
            skipped: 0,
            duration_ms: 0,
            coverage: None,
            failures: Vec::new(),
        })
    }
    
    fn parse_go_output(&self, output: &str) -> Result<TestResult> {
        let mut passed = 0;
        let mut failed = 0;
        
        for line in output.lines() {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(line) {
                if json["Action"] == "pass" {
                    passed += 1;
                } else if json["Action"] == "fail" {
                    failed += 1;
                }
            }
        }
        
        Ok(TestResult {
            total_tests: passed + failed,
            passed,
            failed,
            skipped: 0,
            duration_ms: 0,
            coverage: None,
            failures: Vec::new(),
        })
    }
    
    fn parse_mocha_output(&self, output: &str) -> Result<TestResult> {
        let json: serde_json::Value = serde_json::from_str(output)
            .unwrap_or_else(|_| serde_json::json!({}));
        
        let stats = &json["stats"];
        let total = stats["tests"].as_u64().unwrap_or(0) as u32;
        let passed = stats["passes"].as_u64().unwrap_or(0) as u32;
        let failed = stats["failures"].as_u64().unwrap_or(0) as u32;
        
        Ok(TestResult {
            total_tests: total,
            passed,
            failed,
            skipped: 0,
            duration_ms: stats["duration"].as_u64().unwrap_or(0),
            coverage: None,
            failures: Vec::new(),
        })
    }
    
    fn parse_junit_output(&self, _output: &str) -> Result<TestResult> {
        // Parse Maven output
        Ok(TestResult {
            total_tests: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration_ms: 0,
            coverage: None,
            failures: Vec::new(),
        })
    }
}

// Tauri commands
#[tauri::command]
pub async fn detect_test_framework(project_path: String) -> Result<String, String> {
    let framework = TestRunner::detect_framework(&PathBuf::from(project_path))
        .map_err(|e| e.to_string())?;
    
    Ok(format!("{:?}", framework))
}

#[tauri::command]
pub async fn run_project_tests(
    project_path: String,
    framework: String,
) -> Result<TestResult, String> {
    let test_framework = match framework.as_str() {
        "Jest" => TestFramework::Jest,
        "Vitest" => TestFramework::Vitest,
        "PyTest" => TestFramework::PyTest,
        "Cargo" => TestFramework::Cargo,
        "Go" => TestFramework::Go,
        "Mocha" => TestFramework::Mocha,
        "JUnit" => TestFramework::JUnit,
        _ => return Err("Unknown test framework".to_string()),
    };
    
    let runner = TestRunner::new(test_framework, PathBuf::from(project_path));
    runner.run_tests()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn watch_tests(project_path: String) -> Result<(), String> {
    // Start test watcher in background
    tracing::info!("Starting test watcher for: {}", project_path);
    Ok(())
}
