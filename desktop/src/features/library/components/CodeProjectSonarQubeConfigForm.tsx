import { useCallback, useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useT } from "../../../i18n/I18nContext";
import type { CodeProjectFormDraft } from "../../../types/codeProject";

interface CodeProjectSonarQubeConfigFormProps {
  draft: CodeProjectFormDraft;
  onDraftChange: (patch: Partial<CodeProjectFormDraft>) => void;
  onTestConnection: (
    apiUrl: string,
    projectKey: string,
    authToken: string,
  ) => Promise<{ valid: boolean; error?: string; issueCount?: number }>;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export function CodeProjectSonarQubeConfigForm({
  draft,
  onDraftChange,
  onTestConnection,
  onSubmit,
  onCancel,
  saving,
}: CodeProjectSonarQubeConfigFormProps) {
  const t = useT();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    error?: string;
    issueCount?: number;
  } | null>(null);
  const [_errors, setErrors] = useState<Record<string, string>>({});

  const handleTestConnection = useCallback(async () => {
    if (draft.analysisMode !== "connected") {
      return;
    }
    setTesting(true);
    try {
      const result = await onTestConnection(
        draft.sonarqubeApiUrl,
        draft.sonarqubeProjectKey,
        draft.sonarqubeAuthToken,
      );
      setTestResult(result);
      if (result.valid) {
        setErrors({});
      }
    } finally {
      setTesting(false);
    }
  }, [draft, onTestConnection]);

  const canTest =
    draft.analysisMode === "connected" &&
    draft.sonarqubeApiUrl.trim() &&
    draft.sonarqubeProjectKey.trim() &&
    draft.sonarqubeAuthToken.trim();

  const canSave = draft.analysisMode === "local" || (Boolean(canTest) && testResult?.valid);

  return (
    <form className="sonarqube-config-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-field">
        <span className="field-label">{t.simpleMode.codeProjects.analysisMode}</span>
        <div className="mode-toggle-row" role="radiogroup">
          <button
            type="button"
            className={`selector-filter-chip ${draft.analysisMode === "local" ? "active" : ""}`}
            onClick={() =>
              onDraftChange({
                analysisMode: "local",
                sonarqubeSyncRules: false,
              })
            }
            disabled={saving || testing}
            aria-pressed={draft.analysisMode === "local"}
          >
            {t.simpleMode.codeProjects.localMode}
          </button>
          <button
            type="button"
            className={`selector-filter-chip ${draft.analysisMode === "connected" ? "active" : ""}`}
            onClick={() =>
              onDraftChange({
                analysisMode: "connected",
                sonarqubeSyncRules: true,
              })
            }
            disabled={saving || testing}
            aria-pressed={draft.analysisMode === "connected"}
          >
            {t.simpleMode.codeProjects.connectedMode}
          </button>
        </div>
        <span className="support-copy">
          {draft.analysisMode === "local"
            ? t.simpleMode.codeProjects.localModeHelp
            : t.simpleMode.codeProjects.connectedModeHelp}
        </span>
      </div>

      <div className="form-field">
        <label htmlFor="local-rules-profile" className="field-label">
          {t.simpleMode.codeProjects.localRulesProfile}
        </label>
        <select
          id="local-rules-profile"
          className="maia-input"
          value={draft.localRulesProfile}
          onChange={(e) => onDraftChange({ localRulesProfile: e.target.value })}
          disabled={saving || testing}
        >
          <option value="maia-default">{t.simpleMode.codeProjects.localRulesMaiaDefault}</option>
          <option value="sonar-way-compatible">
            {t.simpleMode.codeProjects.localRulesSonarWay}
          </option>
        </select>
        <span className="support-copy">{t.simpleMode.codeProjects.localRulesProfileHelp}</span>
      </div>

      <div className="form-field">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={draft.sonarqubeSyncRules}
            onChange={(e) =>
              onDraftChange({
                sonarqubeSyncRules: e.target.checked,
                analysisMode: e.target.checked ? "connected" : draft.analysisMode,
              })
            }
            disabled={saving || testing}
          />
          <span>{t.simpleMode.codeProjects.syncRulesFromServer}</span>
        </label>
        <span className="support-copy">{t.simpleMode.codeProjects.syncRulesFromServerHelp}</span>
      </div>

      <div className="form-field">
        <label htmlFor="sonarqube-url" className="field-label">
          {t.simpleMode.codeProjects.sonarqubeServerUrl}
        </label>
        <input
          id="sonarqube-url"
          type="url"
          className="maia-input"
          value={draft.sonarqubeApiUrl}
          onChange={(e) => onDraftChange({ sonarqubeApiUrl: e.target.value })}
          placeholder="https://sonarqube.example.com"
          disabled={saving || testing || draft.analysisMode === "local"}
        />
        <span className="support-copy">{t.simpleMode.codeProjects.sonarqubeServerUrlHelp}</span>
      </div>

      <div className="form-field">
        <label htmlFor="project-key" className="field-label">
          {t.simpleMode.codeProjects.sonarqubeProjectKey}
        </label>
        <input
          id="project-key"
          type="text"
          className="maia-input"
          value={draft.sonarqubeProjectKey}
          onChange={(e) => onDraftChange({ sonarqubeProjectKey: e.target.value })}
          placeholder="org.example:my-service"
          disabled={saving || testing || draft.analysisMode === "local"}
        />
        <span className="support-copy">{t.simpleMode.codeProjects.sonarqubeProjectKeyHelp}</span>
      </div>

      <div className="form-field">
        <label htmlFor="auth-token" className="field-label">
          {t.simpleMode.codeProjects.sonarqubeAuthToken}
        </label>
        <input
          id="auth-token"
          type="password"
          className="maia-input"
          value={draft.sonarqubeAuthToken}
          onChange={(e) => onDraftChange({ sonarqubeAuthToken: e.target.value })}
          placeholder="squ_xxxxxxxxxxxx"
          disabled={saving || testing || draft.analysisMode === "local"}
        />
        <span className="support-copy">{t.simpleMode.codeProjects.sonarqubeAuthTokenHelp}</span>
      </div>

      <div className="test-connection-section">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleTestConnection}
          disabled={!canTest || saving || testing}
        >
          {testing ? t.simpleMode.common.testing : t.simpleMode.codeProjects.testConnection}
        </button>

        {testResult && (
          <div className={`test-result ${testResult.valid ? "success" : "error"}`}>
            {testResult.valid ? (
              <>
                <CheckCircle size={16} />
                <span>
                  {t.simpleMode.codeProjects.connectionValid}
                  {testResult.issueCount !== undefined && ` (${testResult.issueCount} issues)`}
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={16} />
                <span>{testResult.error || "Connection failed"}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={!canSave || saving}
        >
          {saving ? t.simpleMode.common.saving : t.simpleMode.common.save}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          {t.simpleMode.common.cancel}
        </button>
      </div>
    </form>
  );
}
