use std::time::Duration;
use std::thread::sleep;

/// Configuration for retry logic with exponential backoff
#[derive(Debug, Clone)]
pub struct RetryConfig {
    pub max_retries: u32,
    pub initial_delay_ms: u64,
    pub max_delay_ms: u64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_retries: 3,
            initial_delay_ms: 1000,
            max_delay_ms: 8000,
        }
    }
}

/// Retry an operation with exponential backoff
/// 
/// # Arguments
/// * `operation` - The operation to retry
/// * `config` - Retry configuration
/// 
/// # Returns
/// Result of the operation after retries
pub fn retry_with_backoff<F, T, E>(
    mut operation: F,
    config: RetryConfig,
) -> Result<T, E>
where
    F: FnMut() -> Result<T, E>,
    E: std::fmt::Display,
{
    let mut delay = config.initial_delay_ms;
    
    for attempt in 0..=config.max_retries {
        match operation() {
            Ok(result) => {
                if attempt > 0 {
                    println!("✓ Operation succeeded on attempt {}", attempt + 1);
                }
                return Ok(result);
            }
            Err(e) if attempt == config.max_retries => {
                println!("✗ All {} attempts failed. Last error: {}", config.max_retries + 1, e);
                return Err(e);
            }
            Err(e) => {
                println!("⚠ Attempt {} failed: {}. Retrying in {}ms...", 
                    attempt + 1, e, delay);
                sleep(Duration::from_millis(delay));
                delay = (delay * 2).min(config.max_delay_ms);
            }
        }
    }
    unreachable!()
}

/// Retry an operation with a custom retry condition
pub fn retry_with_condition<F, T, E, C>(
    mut operation: F,
    mut should_retry: C,
    config: RetryConfig,
) -> Result<T, E>
where
    F: FnMut() -> Result<T, E>,
    C: FnMut(&E) -> bool,
    E: std::fmt::Display,
{
    let mut delay = config.initial_delay_ms;
    
    for attempt in 0..=config.max_retries {
        match operation() {
            Ok(result) => return Ok(result),
            Err(e) if attempt == config.max_retries || !should_retry(&e) => {
                return Err(e);
            }
            Err(e) => {
                println!("Attempt {} failed: {}. Retrying in {}ms...", 
                    attempt + 1, e, delay);
                sleep(Duration::from_millis(delay));
                delay = (delay * 2).min(config.max_delay_ms);
            }
        }
    }
    unreachable!()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_retry_success_first_attempt() {
        let mut call_count = 0;
        let result = retry_with_backoff(
            || {
                call_count += 1;
                Ok::<i32, String>(42)
            },
            RetryConfig::default(),
        );
        
        assert_eq!(result, Ok(42));
        assert_eq!(call_count, 1);
    }

    #[test]
    fn test_retry_success_after_failures() {
        let mut call_count = 0;
        let result = retry_with_backoff(
            || {
                call_count += 1;
                if call_count < 3 {
                    Err("Temporary failure".to_string())
                } else {
                    Ok(42)
                }
            },
            RetryConfig::default(),
        );
        
        assert_eq!(result, Ok(42));
        assert_eq!(call_count, 3);
    }

    #[test]
    fn test_retry_all_attempts_fail() {
        let mut call_count = 0;
        let result = retry_with_backoff(
            || {
                call_count += 1;
                Err::<i32, String>("Permanent failure".to_string())
            },
            RetryConfig {
                max_retries: 2,
                initial_delay_ms: 10,
                max_delay_ms: 100,
            },
        );
        
        assert!(result.is_err());
        assert_eq!(call_count, 3); // Initial + 2 retries
    }
}
