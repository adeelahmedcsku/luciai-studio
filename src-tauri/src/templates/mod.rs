// Module declarations
pub mod network;
pub mod cache;
mod core;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Re-export core types and functions
pub use core::*;

// Re-export network utilities
pub use network::{RetryConfig, retry_with_backoff};
pub use cache::{TemplateCache, CachedTemplate};

/// Progress event payload for template creation
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TemplateProgress {
    pub stage: ProgressStage,
    pub progress: f32,
    pub message: String,
}

#[derive(Clone, Serialize, Deserialize, Debug, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ProgressStage {
    Initializing,
    Downloading,
    Extracting,
    Installing,
    Complete,
    Error,
}

impl TemplateProgress {
    pub fn new(stage: ProgressStage, progress: f32, message: impl Into<String>) -> Self {
        Self {
            stage,
            progress: progress.clamp(0.0, 1.0),
            message: message.into(),
        }
    }
    
    pub fn initializing(message: impl Into<String>) -> Self {
        Self::new(ProgressStage::Initializing, 0.0, message)
    }
    
    pub fn downloading(progress: f32, message: impl Into<String>) -> Self {
        Self::new(ProgressStage::Downloading, progress, message)
    }
    
    pub fn extracting(progress: f32, message: impl Into<String>) -> Self {
        Self::new(ProgressStage::Extracting, progress, message)
    }
    
    pub fn installing(progress: f32, message: impl Into<String>) -> Self {
        Self::new(ProgressStage::Installing, progress, message)
    }
    
    pub fn complete(message: impl Into<String>) -> Self {
        Self::new(ProgressStage::Complete, 1.0, message)
    }
    
    pub fn error(message: impl Into<String>) -> Self {
        Self::new(ProgressStage::Error, 0.0, message)
    }
}

