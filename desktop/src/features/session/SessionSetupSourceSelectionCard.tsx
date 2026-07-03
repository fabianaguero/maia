import { useT } from "../../i18n/I18nContext";
import type { RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode } from "./sessionDisplay";

interface SessionSetupSourceSelectionCardProps {
  sourceOptions: RepositoryAnalysis[];
  mode: QuickSessionMode;
  selectedSourceId: string | null;
  selectedSource: RepositoryAnalysis | null;
  onModeChange: (mode: QuickSessionMode) => void;
  onSourceSelect: (sourceId: string) => void;
}

export function SessionSetupSourceSelectionCard({
  sourceOptions,
  mode,
  selectedSourceId,
  selectedSource,
  onModeChange,
  onSourceSelect,
}: SessionSetupSourceSelectionCardProps) {
  const t = useT();

  return (
    <div className="audio-path-card monitor-setup-card">
      <span>{t.session.stepSourceTitle}</span>
      <p className="monitor-empty-hint">{t.session.stepSourceHelp}</p>

      <div className="session-mode-tabs">
        <button
          type="button"
          className={`session-mode-tab${mode === "log" ? " active" : ""}`}
          onClick={() => onModeChange("log")}
        >
          {t.session.logFile}
        </button>
        <button
          type="button"
          className={`session-mode-tab${mode === "repo" ? " active" : ""}`}
          onClick={() => onModeChange("repo")}
        >
          {t.session.repository}
        </button>
      </div>

      {sourceOptions.length === 0 ? (
        <p className="placeholder">
          {mode === "log" ? t.session.noImportedLogs : t.session.noImportedRepos}
        </p>
      ) : (
        <div className="session-asset-options">
          {sourceOptions.map((source) => (
            <button
              key={source.id}
              type="button"
              className={`session-asset-option${selectedSourceId === source.id ? " selected" : ""}`}
              onClick={() => onSourceSelect(source.id)}
            >
              <span className="session-asset-title">{source.title}</span>
              <span className="session-asset-path">{source.sourcePath}</span>
            </button>
          ))}
        </div>
      )}

      {selectedSource && (
        <div className="monitor-source-summary">
          <small>{t.session.selected}</small>
          <strong>{selectedSource.title}</strong>
        </div>
      )}
    </div>
  );
}
