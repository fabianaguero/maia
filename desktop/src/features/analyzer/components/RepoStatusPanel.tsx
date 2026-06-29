import type { LibraryTrack } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";

interface RepoStatusPanelProps {
  track: LibraryTrack;
  analyzerLabel: string;
}

export function RepoStatusPanel({ track, analyzerLabel }: RepoStatusPanelProps) {
  const t = useT();
  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.inspect.repoSuggestedBpmTitle}</h2>
          <p className="support-copy">{t.inspect.repoSuggestedBpmCopy}</p>
        </div>
      </div>

      <div className="status-stack">
        <div className="status-row">
          <span>{t.inspect.status}</span>
          <strong>{track.analysis.repoSuggestedStatus}</strong>
        </div>
        <div className="status-row">
          <span>{t.inspect.suggestedBpm}</span>
          <strong>{track.analysis.repoSuggestedBpm ?? t.inspect.pending}</strong>
        </div>
        <div className="status-row">
          <span>{t.inspect.bridge}</span>
          <strong>{analyzerLabel}</strong>
        </div>
      </div>
    </section>
  );
}
