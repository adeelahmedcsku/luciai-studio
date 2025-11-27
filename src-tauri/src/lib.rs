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