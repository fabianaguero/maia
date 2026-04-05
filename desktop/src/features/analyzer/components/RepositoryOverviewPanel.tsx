import type { RepositoryAnalysis } from "../../../types/library";

interface RepositoryOverviewPanelProps {
  repository: RepositoryAnalysis;
}

export function RepositoryOverviewPanel({
  repository,
}: RepositoryOverviewPanelProps) {
  const intakeCopy =
    repository.sourceKind === "directory"
      ? "Local filesystem repository snapshotted into Maia storage for deterministic heuristics."
      : repository.sourceKind === "file"
        ? "Local log file snapshotted into Maia storage for baseline analysis, while live tail monitoring keeps listening to the original growing file."
        : "Remote GitHub reference stored for metadata-only intake until clone support lands.";

  return (
    <section className="panel waveform-panel">
      <div className="panel-header">
        <div>
          <h2>Code/log intake</h2>
          <p className="support-copy">{intakeCopy}</p>
        </div>
      </div>

      <div className="repo-hero">
        <div className="repo-hero-card">
          <span>Summary</span>
          <strong>{repository.summary}</strong>
        </div>
        <div className="repo-hero-card">
          <span>Source</span>
          <strong>{repository.sourcePath}</strong>
        </div>
        <div className="repo-hero-card">
          <span>Storage</span>
          <strong>{repository.storagePath ?? "No managed snapshot"}</strong>
        </div>
        <div className="repo-hero-card">
          <span>Tags</span>
          <div className="pill-strip">
            {repository.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
