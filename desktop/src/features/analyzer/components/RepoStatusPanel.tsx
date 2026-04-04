import type { LibraryTrack } from "../../../types/library";

interface RepoStatusPanelProps {
  track: LibraryTrack;
  analyzerLabel: string;
}

export function RepoStatusPanel({
  track,
  analyzerLabel,
}: RepoStatusPanelProps) {
  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>Repo-suggested BPM</h2>
          <p className="support-copy">
            Reserved for the future Java/Jakarta EE analysis pass.
          </p>
        </div>
      </div>

      <div className="status-stack">
        <div className="status-row">
          <span>Status</span>
          <strong>{track.repoSuggestedStatus}</strong>
        </div>
        <div className="status-row">
          <span>Suggested BPM</span>
          <strong>{track.repoSuggestedBpm ?? "Pending"}</strong>
        </div>
        <div className="status-row">
          <span>Analyzer bridge</span>
          <strong>{analyzerLabel}</strong>
        </div>
      </div>
    </section>
  );
}

