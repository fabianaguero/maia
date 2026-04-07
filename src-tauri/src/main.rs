// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Serialize, Deserialize, Debug)]
pub struct AnalysisRequest {
    pub file_path: String,
    pub analyzer_path: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AnalysisResult {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
}

/// Run the Python analyzer on an audio file and return parsed JSON
#[tauri::command]
async fn analyze_track(request: AnalysisRequest) -> Result<AnalysisResult, String> {
    let analyzer = request
        .analyzer_path
        .unwrap_or_else(|| "python3".to_string());

    let output = Command::new(&analyzer)
        .args([
            "-m",
            "analyzer.cli",
            "analyze-track",
            "--file",
            &request.file_path,
        ])
        .output()
        .map_err(|e| format!("Failed to run analyzer: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        match serde_json::from_str::<serde_json::Value>(&stdout) {
            Ok(data) => Ok(AnalysisResult {
                success: true,
                data: Some(data),
                error: None,
            }),
            Err(e) => Ok(AnalysisResult {
                success: false,
                data: None,
                error: Some(format!("Failed to parse analyzer output: {}", e)),
            }),
        }
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Ok(AnalysisResult {
            success: false,
            data: None,
            error: Some(stderr.to_string()),
        })
    }
}

/// Run the Python analyzer on a repository path
#[tauri::command]
async fn analyze_repo(repo_path: String) -> Result<AnalysisResult, String> {
    let output = Command::new("python3")
        .args(["-m", "analyzer.cli", "analyze-repo", "--path", &repo_path])
        .output()
        .map_err(|e| format!("Failed to run repo analyzer: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        match serde_json::from_str::<serde_json::Value>(&stdout) {
            Ok(data) => Ok(AnalysisResult {
                success: true,
                data: Some(data),
                error: None,
            }),
            Err(e) => Ok(AnalysisResult {
                success: false,
                data: None,
                error: Some(format!("Failed to parse analyzer output: {}", e)),
            }),
        }
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Ok(AnalysisResult {
            success: false,
            data: None,
            error: Some(stderr.to_string()),
        })
    }
}

/// List all analyzed assets from SQLite DB
#[tauri::command]
async fn list_assets(db_path: String) -> Result<serde_json::Value, String> {
    let output = Command::new("python3")
        .args(["-m", "analyzer.cli", "list-assets", "--db", &db_path])
        .output()
        .map_err(|e| format!("Failed to list assets: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        serde_json::from_str(&stdout).map_err(|e| format!("Parse error: {}", e))
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(stderr.to_string())
    }
}

// ---------------------------------------------------------------------------
// Frontend logging — forwards JS console messages to the terminal
// ---------------------------------------------------------------------------

#[tauri::command]
fn log_to_terminal(level: String, message: String) {
    println!("{level} {message}");
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            analyze_track,
            analyze_repo,
            list_assets,
            log_to_terminal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
