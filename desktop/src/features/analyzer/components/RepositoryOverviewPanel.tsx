import type { RepositoryAnalysis } from "../../../types/library";

interface RepositoryOverviewPanelProps {
  repository: RepositoryAnalysis;
}

export function RepositoryOverviewPanel({
  repository,
}: RepositoryOverviewPanelProps) {
  return (
    <section className="panel waveform-panel">
      <div className="panel-header">
        <div>
          <h2>Repository intake</h2>
          <p className="support-copy">
            {repository.sourceKind === "directory"
              ? "Local filesystem repository ready for deterministic heuristics."
              : "Remote GitHub reference stored for metadata-only intake until clone support lands."}
          </p>
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
