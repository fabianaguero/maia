use serde_json::{json, Value};
use std::collections::HashSet;

#[derive(Debug, Clone)]
pub struct SonarQubeAdapter {
    pub api_url: String,
    pub project_key: String,
    pub auth_token: String,
    pub last_known_issue_keys: HashSet<String>,
}

impl SonarQubeAdapter {
    pub fn new(api_url: String, project_key: String, auth_token: String) -> Self {
        Self {
            api_url,
            project_key,
            auth_token,
            last_known_issue_keys: HashSet::new(),
        }
    }

    /// Fetch issues from SonarQube API and format as log lines
    pub async fn poll(&mut self) -> Result<Vec<String>, String> {
        let client = reqwest::Client::new();
        let url = format!(
            "{}/api/issues/search?componentKeys={}&statuses=OPEN,CONFIRMED&ps=500",
            self.api_url, self.project_key
        );

        let response = client
            .get(&url)
            .bearer_auth(&self.auth_token)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch SonarQube issues: {}", e))?;

        let data: Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse SonarQube response: {}", e))?;

        let issues = data
            .get("issues")
            .and_then(|v| v.as_array())
            .ok_or("No issues array in SonarQube response")?;

        let mut new_log_lines = Vec::new();
        let mut current_keys = HashSet::new();

        for issue in issues {
            let key = issue
                .get("key")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown");

            current_keys.insert(key.to_string());

            // Only report new issues (not seen in last poll)
            if !self.last_known_issue_keys.contains(key) {
                let line = self.format_issue_as_log_line(issue);
                new_log_lines.push(line);
            }
        }

        self.last_known_issue_keys = current_keys;

        Ok(new_log_lines)
    }

    /// Convert SonarQube issue JSON to log line format
    fn format_issue_as_log_line(&self, issue: &Value) -> String {
        let severity = issue
            .get("severity")
            .and_then(|v| v.as_str())
            .unwrap_or("INFO");

        let rule = issue
            .get("rule")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown:rule");

        let message = issue
            .get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("Code quality issue");

        let component = issue
            .get("component")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");

        let line = issue.get("line").and_then(|v| v.as_i64());

        let location = if let Some(line_num) = line {
            format!("{}:{}", component, line_num)
        } else {
            component.to_string()
        };

        // Map SonarQube severity to logging level
        let log_level = match severity {
            "BLOCKER" => "CRITICAL",
            "CRITICAL" => "CRITICAL",
            "MAJOR" => "ERROR",
            "MINOR" => "WARN",
            _ => "INFO",
        };

        let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);

        format!(
            "[{}] [SONARQUBE-{}] {} {}",
            now, log_level, rule, message
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_issue_as_log_line() {
        let adapter =
            SonarQubeAdapter::new("http://localhost:9000".to_string(), "test:app".to_string(), "token".to_string());

        let issue = json!({
            "key": "issue-1",
            "severity": "CRITICAL",
            "rule": "java:S1135",
            "message": "Hardcoded password detected",
            "component": "test:app/src/Auth.java",
            "line": 42
        });

        let line = adapter.format_issue_as_log_line(&issue);
        assert!(line.contains("SONARQUBE-CRITICAL"));
        assert!(line.contains("java:S1135"));
        assert!(line.contains("Hardcoded password detected"));
    }

    #[test]
    fn test_severity_mapping() {
        let adapter =
            SonarQubeAdapter::new("http://localhost:9000".to_string(), "test:app".to_string(), "token".to_string());

        let test_cases = vec![
            ("BLOCKER", "CRITICAL"),
            ("CRITICAL", "CRITICAL"),
            ("MAJOR", "ERROR"),
            ("MINOR", "WARN"),
            ("INFO", "INFO"),
        ];

        for (sonar_severity, expected_level) in test_cases {
            let issue = json!({
                "key": "issue-1",
                "severity": sonar_severity,
                "rule": "test:rule",
                "message": "Test message",
                "component": "test:app",
            });

            let line = adapter.format_issue_as_log_line(&issue);
            assert!(line.contains(&format!("SONARQUBE-{}", expected_level)));
        }
    }
}
