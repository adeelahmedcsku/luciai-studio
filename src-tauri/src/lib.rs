// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod agent;
mod llm;
mod project;
mod license;
mod terminal;
mod filesystem;
mod templates;
mod git;
mod git_advanced;
mod preferences;
mod snippets;
mod shortcuts;
mod cloud_llm;
mod performance;
mod testing;
mod plugins;
mod updater;
mod database;
mod code_review;
mod themes;
mod notifications;
mod debugging;
mod profiler;

// Main state that will be shared across the app
#[derive(Default)]
struct AppState {
    // Will be populated as we build
}

fn main() {
    // Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "luciai_studio=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tauri::Builder::default()
        // Initialize Tauri v2 plugins
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            tracing::info!("Luciai Studio starting...");
            
            // Setup app data directory
            let app_dir = app.path()
                .app_data_dir()
                .expect("Failed to get app data dir");
            
            if !app_dir.exists() {
                std::fs::create_dir_all(&app_dir)
                    .expect("Failed to create app data directory");
            }
            
            tracing::info!("App data directory: {:?}", app_dir);
            
            // Open DevTools in debug mode
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                    tracing::info!("DevTools opened");
                }
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // License commands
            license::check_license_status,
            license::activate_license,
            
            // Project commands
            project::create_project,
            project::list_projects,
            project::open_project,
            project::delete_project,
            project::save_file,
            project::save_multiple_files,
            project::get_file,
            project::list_project_files,
            project::add_prompt_to_history,
            
            // Agent commands
            agent::send_prompt,
            agent::get_agent_history,
            agent::pipeline::generate_full_project,
            
            // LLM commands
            llm::check_llm_status,
            llm::list_available_models,
            llm::generate_code,
            llm::generate_code_stream,
            llm::pull_model,
            
            // Terminal commands
            terminal::execute_command,
            
            // Filesystem commands
            filesystem::read_file,
            filesystem::write_file,
            filesystem::delete_file,
            filesystem::list_directory,
            filesystem::create_directory,
            filesystem::delete_directory,
            filesystem::path_exists,
            filesystem::get_metadata,
            filesystem::rename_path,
            filesystem::copy_file,
            filesystem::search_files,
            
            // Template commands
            templates::list_project_templates,
            templates::get_project_template,
            templates::search_templates,
            
            // Git commands
            git::git_init,
            git::git_status,
            git::git_add,
            git::git_commit,
            git::git_log,
            git::git_branches,
            git::git_create_branch,
            git::git_checkout,
            git::git_pull,
            git::git_push,
            git::git_add_remote,
            git::git_diff,
            git::git_clone,
            
            // Preferences commands
            preferences::load_preferences,
            preferences::save_preferences,
            preferences::reset_preferences,
            preferences::export_preferences,
            preferences::import_preferences,
            
            // Refactoring commands
            agent::refactorer::refactor_code,
            agent::refactorer::explain_code,
            agent::refactorer::convert_code_language,
            
            // Deployment commands
            agent::deployment::generate_deployment_guide,
            agent::deployment::generate_docker_files,
            agent::deployment::generate_ci_cd_configuration,
            
            // Snippets commands
            snippets::create_snippet,
            snippets::update_snippet,
            snippets::delete_snippet,
            snippets::get_snippet,
            snippets::list_snippets,
            snippets::search_snippets,
            snippets::filter_snippets_by_language,
            snippets::increment_snippet_usage,
            snippets::get_most_used_snippets,
            snippets::export_snippets,
            snippets::import_snippets,
            
            // Shortcuts commands
            shortcuts::get_all_shortcuts,
            shortcuts::get_shortcuts_by_category,
            shortcuts::update_keyboard_shortcut,
            shortcuts::reset_shortcuts_to_defaults,
            
            // Cloud LLM commands
            cloud_llm::add_cloud_llm_config,
            cloud_llm::test_cloud_llm_connection,
            cloud_llm::generate_with_cloud_llm,
            cloud_llm::list_cloud_llm_configs,
            
            // Performance monitoring commands
            performance::get_performance_metrics,
            performance::reset_performance_metrics,
            performance::track_llm_request_perf,
            performance::track_project_generation_perf,
            performance::track_ide_action,
            
            // Testing commands
            testing::detect_test_framework,
            testing::run_project_tests,
            testing::watch_tests,
            
            // Plugin commands
            plugins::list_plugins,
            plugins::get_plugin_info,
            plugins::toggle_plugin_enabled,
            plugins::install_plugin_from_path,
            plugins::uninstall_plugin,
            plugins::execute_plugin_command,
            plugins::search_plugin_marketplace,
            
            // Auto-update commands
            updater::check_for_updates,
            updater::download_update,
            updater::install_update,
            updater::get_update_settings,
            updater::save_update_settings,
            updater::get_current_version,
            
            // Database commands
            database::init_database,
            database::add_project_history,
            database::get_project_history,
            database::index_file_content,
            database::search_indexed_content,
            database::track_feature,
            database::get_all_usage_stats,
            database::create_bookmark,
            database::list_bookmarks,
            database::remove_bookmark,
            database::save_workspace_session,
            database::load_workspace_session,
            database::list_workspace_sessions,
            database::delete_workspace_session,
            database::get_database_size,
            
            // Profiler commands
            profiler::start_performance_profiling,
            profiler::stop_performance_profiling,
            profiler::add_performance_sample,
            profiler::record_function_performance,
            profiler::get_profile_session,
            profiler::list_profile_sessions,
            profiler::generate_performance_report,
            profiler::get_current_memory_snapshot,
            profiler::get_session_cpu_profile,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}