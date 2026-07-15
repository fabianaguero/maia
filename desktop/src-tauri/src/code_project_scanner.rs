use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
struct LocalCodeIssue {
    key: String,
    severity: &'static str,
    rule: &'static str,
    message: String,
    component: String,
    line: usize,
}

fn home_dir() -> Option<PathBuf> {
    std::env::var_os("HOME").or_else(|| std::env::var_os("USERPROFILE")).map(PathBuf::from)
}

fn expanded_input_path(raw_path: &str) -> Result<PathBuf, String> {
    let trimmed = raw_path.trim();
    if trimmed.is_empty() {
        return Err("Local code analysis path is empty.".to_string());
    }
    if trimmed == "~" {
        return home_dir()
            .ok_or_else(|| "Failed to resolve the home directory for `~`.".to_string());
    }
    if let Some(rest) = trimmed.strip_prefix("~/") {
        return home_dir()
            .map(|home| home.join(rest))
            .ok_or_else(|| "Failed to resolve the home directory for `~`.".to_string());
    }
    Ok(PathBuf::from(trimmed))
}

fn should_skip_code_scan_dir(path: &Path) -> bool {
    let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
        return false;
    };

    matches!(
        name,
        ".git"
            | ".idea"
            | ".vscode"
            | ".venv"
            | "node_modules"
            | "target"
            | "dist"
            | "build"
            | "coverage"
            | "__pycache__"
    )
}

fn is_supported_code_file(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|value| value.to_str()),
        Some("go" | "java" | "js" | "jsx" | "kt" | "kts" | "py" | "rs" | "ts" | "tsx")
    )
}

fn detect_local_code_issue(
    line: &str,
    local_rules_profile: &str,
) -> Option<(&'static str, &'static str, String)> {
    let trimmed = line.trim();
    let lowered = trimmed.to_ascii_lowercase();
    let sonar_way_compatible = local_rules_profile == "sonar-way-compatible";

    if lowered.contains("todo") || lowered.contains("fixme") {
        return Some((
            "MINOR",
            "maia-local:todo-marker",
            "TODO/FIXME marker should be triaged before release".to_string(),
        ));
    }

    if trimmed.contains("panic!(") || trimmed.contains(".unwrap()") {
        return Some((
            "MAJOR",
            "maia-local:unsafe-fail-fast",
            "Fail-fast code path may turn a recoverable condition into an outage".to_string(),
        ));
    }

    if !sonar_way_compatible && (trimmed.contains("console.log(") || trimmed.contains("println!("))
    {
        return Some((
            "INFO",
            "maia-local:debug-output",
            "Debug output detected in source code".to_string(),
        ));
    }

    if trimmed.contains("eval(") || trimmed.contains("exec(") {
        return Some((
            "CRITICAL",
            "maia-local:dynamic-execution",
            "Dynamic execution requires explicit security review".to_string(),
        ));
    }

    None
}

pub fn scan_local_code_project_issues(
    repository_path: &str,
    local_rules_profile: &str,
    last_known_keys: &mut HashSet<String>,
    emit_existing: bool,
) -> Result<(Vec<String>, usize), String> {
    let root = expanded_input_path(repository_path)?;
    if !root.exists() {
        return Err(format!("Local code analysis path does not exist: {}", root.display()));
    }
    if !root.is_dir() {
        return Err(format!("Local code analysis path is not a directory: {}", root.display()));
    }

    let mut stack = vec![root.clone()];
    let mut issues = Vec::new();

    while let Some(dir) = stack.pop() {
        if should_skip_code_scan_dir(&dir) {
            continue;
        }

        let entries = fs::read_dir(&dir)
            .map_err(|error| format!("Failed to scan {}: {error}", dir.display()))?;

        for entry in entries {
            let entry = entry.map_err(|error| {
                format!("Failed to read directory entry in {}: {error}", dir.display())
            })?;
            let path = entry.path();
            if path.is_dir() {
                if !should_skip_code_scan_dir(&path) {
                    stack.push(path);
                }
                continue;
            }

            if !is_supported_code_file(&path) {
                continue;
            }

            let content = match fs::read_to_string(&path) {
                Ok(value) => value,
                Err(_) => continue,
            };
            let component = path.strip_prefix(&root).unwrap_or(&path).display().to_string();

            for (index, line) in content.lines().enumerate() {
                if let Some((severity, rule, message)) =
                    detect_local_code_issue(line, local_rules_profile)
                {
                    let line_number = index + 1;
                    let key = format!("{component}:{line_number}:{rule}");
                    issues.push(LocalCodeIssue {
                        key,
                        severity,
                        rule,
                        message,
                        component: component.clone(),
                        line: line_number,
                    });
                }
            }
        }
    }

    let mut new_log_lines = Vec::new();
    let mut current_keys = HashSet::new();
    for issue in &issues {
        current_keys.insert(issue.key.clone());
        if emit_existing && !last_known_keys.contains(&issue.key) {
            let timestamp = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
            new_log_lines.push(format!(
                "[{}] [SONARQUBE-{}] {} {} ({}:{})",
                timestamp, issue.severity, issue.rule, issue.message, issue.component, issue.line
            ));
        }
    }

    let issue_count = current_keys.len();
    *last_known_keys = current_keys;
    Ok((new_log_lines, issue_count))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn unique_temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "maia-{name}-{}",
            SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos()
        ));
        fs::create_dir_all(&dir).expect("create temp dir");
        dir
    }

    #[test]
    fn local_code_project_scan_seeds_baseline_without_lines() {
        let dir = unique_temp_dir("local-baseline");
        let source = dir.join("src.ts");
        fs::write(&source, "export function demo() {\n  // TODO release follow-up\n}\n")
            .expect("write source");

        let mut last_known = HashSet::new();
        let (lines, issue_count) = scan_local_code_project_issues(
            dir.to_str().unwrap(),
            "maia-default",
            &mut last_known,
            false,
        )
        .expect("scan local project");

        assert!(lines.is_empty());
        assert_eq!(issue_count, 1);
        assert_eq!(last_known.len(), 1);

        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn local_code_project_scan_emits_only_new_issues_after_baseline() {
        let dir = unique_temp_dir("local-diff");
        let source = dir.join("src.ts");
        fs::write(&source, "export function demo() {\n  // TODO release follow-up\n}\n")
            .expect("write source");

        let mut last_known = HashSet::new();
        scan_local_code_project_issues(
            dir.to_str().unwrap(),
            "maia-default",
            &mut last_known,
            false,
        )
        .expect("seed baseline");

        fs::write(
            &source,
            "export function demo() {\n  // TODO release follow-up\n  console.log('debug');\n}\n",
        )
        .expect("append source issue");

        let (lines, issue_count) = scan_local_code_project_issues(
            dir.to_str().unwrap(),
            "maia-default",
            &mut last_known,
            true,
        )
        .expect("scan local project");

        assert_eq!(issue_count, 2);
        assert_eq!(lines.len(), 1);
        assert!(lines[0].contains("maia-local:debug-output"));

        fs::remove_dir_all(dir).ok();
    }

    #[test]
    fn local_code_project_sonar_way_profile_reduces_debug_noise() {
        let dir = unique_temp_dir("local-profile");
        let source = dir.join("src.ts");
        fs::write(
            &source,
            "export function demo() {\n  console.log('debug');\n  eval('danger');\n}\n",
        )
        .expect("write source");

        let mut last_known = HashSet::new();
        let (lines, issue_count) = scan_local_code_project_issues(
            dir.to_str().unwrap(),
            "sonar-way-compatible",
            &mut last_known,
            true,
        )
        .expect("scan local project");

        assert_eq!(issue_count, 1);
        assert_eq!(lines.len(), 1);
        assert!(lines[0].contains("maia-local:dynamic-execution"));
        assert!(!lines[0].contains("maia-local:debug-output"));

        fs::remove_dir_all(dir).ok();
    }
}
