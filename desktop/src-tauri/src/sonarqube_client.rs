use serde_json::Value;
use std::collections::HashSet;
use std::time::Duration;

fn format_sonarqube_issue_as_log_line(issue: &Value) -> String {
    let severity = issue.get("severity").and_then(|v| v.as_str()).unwrap_or("INFO");

    let rule = issue.get("rule").and_then(|v| v.as_str()).unwrap_or("unknown:rule");

    let message = issue.get("message").and_then(|v| v.as_str()).unwrap_or("Code quality issue");

    let component = issue.get("component").and_then(|v| v.as_str()).unwrap_or("unknown");

    let line = issue.get("line").and_then(|v| v.as_i64());

    let log_level = match severity {
        "BLOCKER" => "CRITICAL",
        "CRITICAL" => "CRITICAL",
        "MAJOR" => "ERROR",
        "MINOR" => "WARN",
        _ => "INFO",
    };

    let timestamp = issue
        .get("updateDate")
        .or_else(|| issue.get("creationDate"))
        .or_else(|| issue.get("createdAt"))
        .and_then(|v| v.as_str())
        .map(str::to_string)
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true));

    if let Some(line_num) = line {
        format!(
            "[{}] [SONARQUBE-{}] {} {} ({}:{})",
            timestamp, log_level, rule, message, component, line_num
        )
    } else {
        format!("[{}] [SONARQUBE-{}] {} {} ({})", timestamp, log_level, rule, message, component)
    }
}

pub async fn poll_sonarqube_issues(
    api_url: &str,
    project_key: &str,
    auth_token: &str,
    last_known_keys: &mut HashSet<String>,
    emit_existing: bool,
) -> Result<(Vec<String>, usize), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(8))
        .build()
        .map_err(|e| format!("Failed to create SonarQube client: {}", e))?;
    let url = format!("{}/api/issues/search", api_url.trim_end_matches('/'));

    let response = client
        .get(&url)
        .bearer_auth(auth_token)
        .query(&[("componentKeys", project_key), ("statuses", "OPEN,CONFIRMED"), ("ps", "500")])
        .send()
        .await
        .map_err(|e| format!("Failed to fetch SonarQube issues: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to fetch SonarQube issues: HTTP {}", response.status()));
    }

    let data: Value =
        response.json().await.map_err(|e| format!("Failed to parse SonarQube response: {}", e))?;

    let issues = data
        .get("issues")
        .and_then(|v| v.as_array())
        .ok_or("No issues array in SonarQube response")?;

    let mut new_log_lines = Vec::new();
    let mut current_keys = HashSet::new();

    for issue in issues {
        let key = issue.get("key").and_then(|v| v.as_str()).unwrap_or("unknown");

        current_keys.insert(key.to_string());

        // Passive monitoring should not convert the initial baseline into anomalies.
        if emit_existing && !last_known_keys.contains(key) {
            let line = format_sonarqube_issue_as_log_line(issue);
            new_log_lines.push(line);
        }
    }

    let issue_count = current_keys.len();
    *last_known_keys = current_keys;
    Ok((new_log_lines, issue_count))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn formats_issue_with_source_timestamp_and_severity_mapping() {
        let line = format_sonarqube_issue_as_log_line(&json!({
            "key": "issue-1",
            "severity": "MAJOR",
            "rule": "typescript:S1234",
            "message": "Unexpected complexity",
            "component": "src/app.ts",
            "line": 42,
            "updateDate": "2026-07-12T03:00:00Z"
        }));

        assert!(line.contains("[2026-07-12T03:00:00Z] [SONARQUBE-ERROR]"));
        assert!(line.contains("typescript:S1234 Unexpected complexity (src/app.ts:42)"));
    }
}
