use serde::{Deserialize, Serialize};
use anyhow::Result;

use crate::llm::{LLMClient, GenerationRequest};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefactoringResult {
    pub original_code: String,
    pub refactored_code: String,
    pub changes: Vec<RefactoringChange>,
    pub improvement_summary: String,
    pub impact: RefactoringImpact,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefactoringChange {
    pub change_type: ChangeType,
    pub description: String,
    pub line_range: Option<(usize, usize)>,
    pub benefit: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChangeType {
    ExtractFunction,
    RenameVariable,
    SimplifyLogic,
    RemoveDuplication,
    ImprovePerformance,
    EnhanceReadability,
    AddErrorHandling,
    TypeSafety,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefactoringImpact {
    pub readability: i32, // -100 to +100
    pub performance: i32,
    pub maintainability: i32,
    pub testability: i32,
}

pub struct CodeRefactorer {
    llm_client: LLMClient,
}

impl CodeRefactorer {
    pub fn new() -> Self {
        Self {
            llm_client: LLMClient::new(),
        }
    }
    
    /// Refactor code for better quality
    pub async fn refactor_code(
        &self,
        code: &str,
        language: &str,
        focus: RefactorFocus,
    ) -> Result<RefactoringResult> {
        let focus_description = self.focus_description(&focus);
        
        let prompt = format!(
            r#"Refactor this {language} code with focus on: {focus}

ORIGINAL CODE:
```{language}
{code}
```

Requirements:
1. Improve code quality significantly
2. Maintain exact same functionality
3. Follow {language} best practices
4. Add helpful comments
5. Make code more maintainable

Provide response in this format:

REFACTORED CODE:
```{language}
[improved code here]
```

CHANGES:
1. [Change type]: [Description] - Benefit: [Why this improves the code]
2. ...

IMPROVEMENT SUMMARY:
[Overall summary of improvements]

IMPACT:
Readability: [+XX or -XX]
Performance: [+XX or -XX]
Maintainability: [+XX or -XX]
Testability: [+XX or -XX]"#,
            language = language,
            focus = focus_description,
            code = code
        );
        
        let request = GenerationRequest {
            model: "deepseek-coder-v2:16b".to_string(),
            prompt,
            system_prompt: Some(format!(
                "You are an expert {} developer and code reviewer. Refactor code to be cleaner, \
                more efficient, and more maintainable while preserving exact functionality.",
                language
            )),
            temperature: 0.6,
            max_tokens: 4096,
        };
        
        let response = self.llm_client.generate(request).await?;
        
        self.parse_refactoring_result(&response.text, code)
    }
    
    /// Explain code in detail
    pub async fn explain_code(
        &self,
        code: &str,
        language: &str,
    ) -> Result<String> {
        let prompt = format!(
            r#"Explain this {language} code in detail:

```{language}
{code}
```

Provide:
1. **Overview** - What does this code do?
2. **Step-by-step breakdown** - Explain each important part
3. **Key concepts** - What programming concepts are used?
4. **Potential issues** - Any problems or edge cases?
5. **Suggestions** - How could it be improved?

Make the explanation clear and educational."#,
            language = language,
            code = code
        );
        
        let request = GenerationRequest {
            model: "deepseek-coder-v2:16b".to_string(),
            prompt,
            system_prompt: Some("You are a patient programming teacher. Explain code clearly and thoroughly.".to_string()),
            temperature: 0.7,
            max_tokens: 2048,
        };
        
        let response = self.llm_client.generate(request).await?;
        Ok(response.text)
    }
    
    /// Convert code between languages
    pub async fn convert_language(
        &self,
        code: &str,
        from_language: &str,
        to_language: &str,
    ) -> Result<String> {
        let prompt = format!(
            r#"Convert this code from {from_lang} to {to_lang}:

ORIGINAL ({from_lang}):
```{from_lang}
{code}
```

Requirements:
1. Preserve exact functionality
2. Use idiomatic {to_lang} patterns
3. Include proper imports
4. Add type annotations if applicable
5. Follow {to_lang} best practices
6. Add comments explaining {to_lang}-specific features

Generate ONLY the converted code:"#,
            from_lang = from_language,
            to_lang = to_language,
            code = code
        );
        
        let request = GenerationRequest {
            model: "deepseek-coder-v2:16b".to_string(),
            prompt,
            system_prompt: Some(format!(
                "You are an expert in both {} and {}. Convert code accurately while \
                following best practices of the target language.",
                from_language, to_language
            )),
            temperature: 0.5,
            max_tokens: 3072,
        };
        
        let response = self.llm_client.generate(request).await?;
        Ok(self.clean_code(&response.text))
    }
    
    /// Add documentation to code
    pub async fn add_documentation(
        &self,
        code: &str,
        language: &str,
    ) -> Result<String> {
        let prompt = format!(
            r#"Add comprehensive documentation to this {language} code:

```{language}
{code}
```

Requirements:
1. Add function/method documentation
2. Add inline comments for complex logic
3. Include parameter descriptions
4. Document return values
5. Add usage examples where helpful
6. Follow {language} documentation conventions (JSDoc, docstrings, etc.)

Generate the fully documented code:"#,
            language = language,
            code = code
        );
        
        let request = GenerationRequest {
            model: "deepseek-coder-v2:16b".to_string(),
            prompt,
            system_prompt: Some("You are a documentation expert. Add clear, helpful documentation to code.".to_string()),
            temperature: 0.6,
            max_tokens: 4096,
        };
        
        let response = self.llm_client.generate(request).await?;
        Ok(self.clean_code(&response.text))
    }
    
    /// Optimize code for performance
    pub async fn optimize_performance(
        &self,
        code: &str,
        language: &str,
    ) -> Result<RefactoringResult> {
        self.refactor_code(code, language, RefactorFocus::Performance).await
    }
    
    /// Add error handling to code
    pub async fn add_error_handling(
        &self,
        code: &str,
        language: &str,
    ) -> Result<String> {
        let prompt = format!(
            r#"Add comprehensive error handling to this {language} code:

```{language}
{code}
```

Requirements:
1. Add try-catch blocks where needed
2. Handle edge cases
3. Validate inputs
4. Add meaningful error messages
5. Log errors appropriately
6. Don't break existing functionality

Generate the code with error handling:"#,
            language = language,
            code = code
        );
        
        let request = GenerationRequest {
            model: "deepseek-coder-v2:16b".to_string(),
            prompt,
            system_prompt: Some("You are an expert in defensive programming. Add robust error handling.".to_string()),
            temperature: 0.6,
            max_tokens: 3072,
        };
        
        let response = self.llm_client.generate(request).await?;
        Ok(self.clean_code(&response.text))
    }
    
    // Helper methods
    
    fn focus_description(&self, focus: &RefactorFocus) -> &str {
        match focus {
            RefactorFocus::Readability => "improving readability and code clarity",
            RefactorFocus::Performance => "optimizing performance and efficiency",
            RefactorFocus::Maintainability => "improving maintainability and reducing complexity",
            RefactorFocus::TestAbility => "making code more testable",
            RefactorFocus::Security => "enhancing security and fixing vulnerabilities",
            RefactorFocus::All => "overall code quality improvement",
        }
    }
    
    fn parse_refactoring_result(
        &self,
        response: &str,
        original_code: &str,
    ) -> Result<RefactoringResult> {
        // Extract refactored code
        let refactored_code = self.extract_code_section(response, "REFACTORED CODE");
        
        // Extract changes (simple parsing)
        let changes = self.extract_changes(response);
        
        // Extract summary
        let improvement_summary = self.extract_section(response, "IMPROVEMENT SUMMARY")
            .unwrap_or_else(|| "Code has been refactored for improved quality.".to_string());
        
        // Extract or estimate impact
        let impact = self.extract_impact(response);
        
        Ok(RefactoringResult {
            original_code: original_code.to_string(),
            refactored_code,
            changes,
            improvement_summary,
            impact,
        })
    }
    
    fn extract_code_section(&self, text: &str, section: &str) -> String {
        let section_re = regex::Regex::new(&format!(r"{}:[\s\S]*?```[\w]*\s*\n([\s\S]*?)\n```", section)).unwrap();
        if let Some(captures) = section_re.captures(text) {
            return captures.get(1).unwrap().as_str().to_string();
        }
        self.clean_code(text)
    }
    
    fn extract_section(&self, text: &str, section: &str) -> Option<String> {
        let section_re = regex::Regex::new(&format!(r"{}:\s*\n([\s\S]*?)(?:\n\n|$)", section)).unwrap();
        section_re.captures(text)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().trim().to_string())
    }
    
    fn extract_changes(&self, text: &str) -> Vec<RefactoringChange> {
        let mut changes = Vec::new();
        let change_re = regex::Regex::new(r"\d+\.\s*\[([^\]]+)\]:\s*([^-]+)\s*-\s*Benefit:\s*(.+)").unwrap();
        
        for cap in change_re.captures_iter(text) {
            if let (Some(change_type), Some(desc), Some(benefit)) = (cap.get(1), cap.get(2), cap.get(3)) {
                changes.push(RefactoringChange {
                    change_type: self.parse_change_type(change_type.as_str()),
                    description: desc.as_str().trim().to_string(),
                    line_range: None,
                    benefit: benefit.as_str().trim().to_string(),
                });
            }
        }
        
        changes
    }
    
    fn parse_change_type(&self, type_str: &str) -> ChangeType {
        let lower = type_str.to_lowercase();
        if lower.contains("extract") || lower.contains("function") {
            ChangeType::ExtractFunction
        } else if lower.contains("rename") {
            ChangeType::RenameVariable
        } else if lower.contains("simplify") {
            ChangeType::SimplifyLogic
        } else if lower.contains("duplicate") || lower.contains("duplication") {
            ChangeType::RemoveDuplication
        } else if lower.contains("performance") || lower.contains("optimize") {
            ChangeType::ImprovePerformance
        } else if lower.contains("readable") || lower.contains("readability") {
            ChangeType::EnhanceReadability
        } else if lower.contains("error") {
            ChangeType::AddErrorHandling
        } else if lower.contains("type") {
            ChangeType::TypeSafety
        } else {
            ChangeType::EnhanceReadability
        }
    }
    
    fn extract_impact(&self, text: &str) -> RefactoringImpact {
        let impact_re = regex::Regex::new(r"Readability:\s*\[?([+-]?\d+)").unwrap();
        let readability = impact_re.captures(text)
            .and_then(|c| c.get(1))
            .and_then(|m| m.as_str().parse().ok())
            .unwrap_or(10);
        
        let perf_re = regex::Regex::new(r"Performance:\s*\[?([+-]?\d+)").unwrap();
        let performance = perf_re.captures(text)
            .and_then(|c| c.get(1))
            .and_then(|m| m.as_str().parse().ok())
            .unwrap_or(5);
        
        let maint_re = regex::Regex::new(r"Maintainability:\s*\[?([+-]?\d+)").unwrap();
        let maintainability = maint_re.captures(text)
            .and_then(|c| c.get(1))
            .and_then(|m| m.as_str().parse().ok())
            .unwrap_or(10);
        
        let test_re = regex::Regex::new(r"Testability:\s*\[?([+-]?\d+)").unwrap();
        let testability = test_re.captures(text)
            .and_then(|c| c.get(1))
            .and_then(|m| m.as_str().parse().ok())
            .unwrap_or(5);
        
        RefactoringImpact {
            readability,
            performance,
            maintainability,
            testability,
        }
    }
    
    fn clean_code(&self, text: &str) -> String {
        let code_block_re = regex::Regex::new(r"```[\w]*\s*\n([\s\S]*?)\n```").unwrap();
        if let Some(captures) = code_block_re.captures(text) {
            return captures.get(1).unwrap().as_str().to_string();
        }
        text.to_string()
    }
}

#[derive(Debug, Clone)]
pub enum RefactorFocus {
    Readability,
    Performance,
    Maintainability,
    TestAbility,
    Security,
    All,
}

// Tauri commands
#[tauri::command]
pub async fn refactor_code(
    code: String,
    language: String,
    focus: String,
) -> Result<RefactoringResult, String> {
    let refactorer = CodeRefactorer::new();
    
    let refactor_focus = match focus.to_lowercase().as_str() {
        "readability" => RefactorFocus::Readability,
        "performance" => RefactorFocus::Performance,
        "maintainability" => RefactorFocus::Maintainability,
        "testability" => RefactorFocus::TestAbility,
        "security" => RefactorFocus::Security,
        _ => RefactorFocus::All,
    };
    
    refactorer.refactor_code(&code, &language, refactor_focus)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn explain_code(
    code: String,
    language: String,
) -> Result<String, String> {
    let refactorer = CodeRefactorer::new();
    refactorer.explain_code(&code, &language)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_code_language(
    code: String,
    from_language: String,
    to_language: String,
) -> Result<String, String> {
    let refactorer = CodeRefactorer::new();
    refactorer.convert_language(&code, &from_language, &to_language)
        .await
        .map_err(|e| e.to_string())
}
