import type { RepositoryAnalysis } from "../../../types/library";

interface RepositoryMetricsPanelProps {
  repository: RepositoryAnalysis;
  analyzerLabel: string;
}

export function RepositoryMetricsPanel({
  repository,
  analyzerLabel,
}: RepositoryMetricsPanelProps) {
  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>Code BPM status</h2>
          <p className="support-copy">
            Heuristic repository metrics and BPM suggestion from the analyzer pipeline.
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>Suggested BPM</span>
          <strong>{repository.suggestedBpm ? Math.round(repository.suggestedBpm) : "Pending"}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{Math.round(repository.confidence * 100)}%</strong>
        </div>
        <div>
          <span>Build system</span>
          <strong>{repository.buildSystem}</strong>
        </div>
        <div>
          <span>Language</span>
          <strong>{repository.primaryLanguage}</strong>
        </div>
        <div>
          <span>Java files</span>
          <strong>{repository.javaFileCount}</strong>
        </div>
        <div>
          <span>Test files</span>
          <strong>{repository.testFileCount}</strong>
        </div>
      </div>

      <div className="status-stack top-spaced">
        <div className="status-row">
          <span>Analyzer status</span>
          <strong>{repository.analyzerStatus}</strong>
        </div>
        <div className="status-row">
          <span>Bridge</span>
          <strong>{analyzerLabel}</strong>
        </div>
      </div>
    </section>
  );
}
