use serde_json::Value;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CodeProjectAnalysisMode {
    Local,
    Connected,
}

impl CodeProjectAnalysisMode {
    pub fn from_config_value(value: Option<&str>) -> Self {
        match value {
            Some("local") => Self::Local,
            _ => Self::Connected,
        }
    }

    pub fn is_local(&self) -> bool {
        matches!(self, Self::Local)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CodeProjectStreamConfig {
    pub api_url: String,
    pub project_key: String,
    pub auth_token: String,
    pub analysis_mode: CodeProjectAnalysisMode,
    pub repository_url: String,
    pub local_rules_profile: String,
}

impl CodeProjectStreamConfig {
    pub fn from_json(config: &Value) -> Self {
        Self {
            api_url: config
                .get("apiUrl")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            project_key: config
                .get("projectKey")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            auth_token: config
                .get("authToken")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            analysis_mode: CodeProjectAnalysisMode::from_config_value(
                config.get("analysisMode").and_then(|v| v.as_str()),
            ),
            repository_url: config
                .get("repositoryUrl")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            local_rules_profile: config
                .get("localRulesProfile")
                .and_then(|v| v.as_str())
                .unwrap_or("maia-default")
                .to_string(),
        }
    }

    pub fn validate_connected(&self) -> Result<(), String> {
        if self.api_url.trim().is_empty() {
            return Err("SonarQube apiUrl not found in config".to_string());
        }
        if self.project_key.trim().is_empty() {
            return Err("SonarQube projectKey not found in config".to_string());
        }
        if self.auth_token.trim().is_empty() {
            return Err("SonarQube authToken not found in config".to_string());
        }
        Ok(())
    }
}

pub fn waiting_status_for_code_project(
    analysis_mode: &CodeProjectAnalysisMode,
    baseline_seeded: bool,
    issue_count: usize,
) -> String {
    if baseline_seeded {
        return if analysis_mode.is_local() {
            "Waiting for local code quality changes.".to_string()
        } else {
            "Waiting for new code quality issues.".to_string()
        };
    }

    format!(
        "{} baseline indexed: {} issue(s). Waiting for new issues.",
        if analysis_mode.is_local() {
            "Local code analysis"
        } else {
            "SonarQube"
        },
        issue_count,
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn parses_local_config_with_defaults() {
        let config = CodeProjectStreamConfig::from_json(&json!({
            "analysisMode": "local",
            "repositoryUrl": "/repo/app"
        }));

        assert_eq!(config.analysis_mode, CodeProjectAnalysisMode::Local);
        assert_eq!(config.repository_url, "/repo/app");
        assert_eq!(config.local_rules_profile, "maia-default");
        assert!(config.api_url.is_empty());
    }

    #[test]
    fn validates_connected_required_fields() {
        let invalid = CodeProjectStreamConfig::from_json(&json!({
            "analysisMode": "connected",
            "apiUrl": "https://sonar.example.com",
            "projectKey": "app"
        }));
        assert_eq!(
            invalid.validate_connected(),
            Err("SonarQube authToken not found in config".to_string())
        );

        let valid = CodeProjectStreamConfig::from_json(&json!({
            "analysisMode": "connected",
            "apiUrl": "https://sonar.example.com",
            "projectKey": "app",
            "authToken": "squ_test"
        }));
        assert!(valid.validate_connected().is_ok());
    }

    #[test]
    fn builds_waiting_status_without_counting_baseline_as_live_data() {
        assert_eq!(
            waiting_status_for_code_project(&CodeProjectAnalysisMode::Local, false, 12),
            "Local code analysis baseline indexed: 12 issue(s). Waiting for new issues."
        );
        assert_eq!(
            waiting_status_for_code_project(&CodeProjectAnalysisMode::Connected, true, 12),
            "Waiting for new code quality issues."
        );
    }
}
