import { useT } from "../../i18n/I18nContext";
import type { RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode } from "./sessionDisplay";
import {
  buildSessionSetupSourceModeTabs,
  buildSessionSetupSourceOptions,
  buildSessionSetupSourceSummary,
  resolveSessionSetupSourceEmptyState,
} from "./sessionSetupSourceSelectionCardRuntime";

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
  const modeTabs = buildSessionSetupSourceModeTabs({ t, mode });
  const emptyState = resolveSessionSetupSourceEmptyState({
    t,
    mode,
    sourceCount: sourceOptions.length,
  });
  const options = buildSessionSetupSourceOptions({
    sourceOptions,
    selectedSourceId,
  });
  const summary = buildSessionSetupSourceSummary({
    t,
    selectedSource,
  });

  return (
    <div className="audio-path-card monitor-setup-card">
      <span>{t.session.stepSourceTitle}</span>
      <p className="monitor-empty-hint">{t.session.stepSourceHelp}</p>

      <div className="session-mode-tabs">
        {modeTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`session-mode-tab${tab.active ? " active" : ""}`}
            onClick={() => onModeChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {emptyState ? (
        <p className="placeholder">{emptyState}</p>
      ) : (
        <div className="session-asset-options">
          {options.map((source) => (
            <button
              key={source.id}
              type="button"
              className={`session-asset-option${source.selected ? " selected" : ""}`}
              onClick={() => onSourceSelect(source.id)}
            >
              <span className="session-asset-title">{source.title}</span>
              <span className="session-asset-path">{source.path}</span>
            </button>
          ))}
        </div>
      )}

      {summary ? (
        <div className="monitor-source-summary">
          <small>{summary.eyebrow}</small>
          <strong>{summary.title}</strong>
        </div>
      ) : null}
    </div>
  );
}
