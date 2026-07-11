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
    draft.sonarqubeApiUrl.trim() &&
    draft.sonarqubeProjectKey.trim() &&
    draft.sonarqubeAuthToken.trim();

  const canSave = canTest && testResult?.valid;

  return (
    <form className="sonarqube-config-form" onSubmit={(e) => e.preventDefault()}>
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
          disabled={saving || testing}
        />
        <span className="support-copy">
          {t.simpleMode.codeProjects.sonarqubeServerUrlHelp}
        </span>
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
          disabled={saving || testing}
        />
        <span className="support-copy">
          {t.simpleMode.codeProjects.sonarqubeProjectKeyHelp}
        </span>
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
          disabled={saving || testing}
        />
        <span className="support-copy">
          {t.simpleMode.codeProjects.sonarqubeAuthTokenHelp}
        </span>
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
          <div
            className={`test-result ${testResult.valid ? "success" : "error"}`}
          >
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
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={saving}
        >
          {t.simpleMode.common.cancel}
        </button>
      </div>
    </form>
  );
}
