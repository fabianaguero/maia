import type { RepositoryAnalysis } from "../../../types/library";

interface RepositoryMetricsPanelProps {
  repository: RepositoryAnalysis;
  analyzerLabel: string;
}

export function RepositoryMetricsPanel({
  repository,
  analyzerLabel,
}: RepositoryMetricsPanelProps) {
  const levelCounts =
    repository.metrics.levelCounts && typeof repository.metrics.levelCounts === "object"
      ? (repository.metrics.levelCounts as Record<string, unknown>)
      : null;
  const anomalyCount =
    typeof repository.metrics.anomalyCount === "number" ? repository.metrics.anomalyCount : 0;
  const lineCount =
    typeof repository.metrics.lineCount === "number" ? repository.metrics.lineCount : 0;
  const astEnabled = repository.metrics.astEnabled === true;
  const astClassCount =
    typeof repository.metrics.astClassCount === "number"
      ? repository.metrics.astClassCount
      : 0;
  const astMethodCount =
    typeof repository.metrics.astMethodCount === "number"
      ? repository.metrics.astMethodCount
      : 0;
  const astEndpointCount =
    typeof repository.metrics.astEndpointAnnotationCount === "number"
      ? repository.metrics.astEndpointAnnotationCount
      : 0;
  const ktEnabled = repository.metrics.ktAstEnabled === true;
  const ktClassCount =
    typeof repository.metrics.ktAstClassCount === "number"
      ? repository.metrics.ktAstClassCount
      : 0;
  const ktFunctionCount =
    typeof repository.metrics.ktAstFunctionCount === "number"
      ? repository.metrics.ktAstFunctionCount
      : 0;
  const parseLanguageFilter = Array.isArray(repository.metrics.parseLanguageFilter)
    ? (repository.metrics.parseLanguageFilter as string[])
    : [];
  const parseExtensionFilter = Array.isArray(repository.metrics.parseExtensionFilter)
    ? (repository.metrics.parseExtensionFilter as string[])
    : [];
  const hasActiveFilters = parseLanguageFilter.length > 0 || parseExtensionFilter.length > 0;

  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>{repository.sourceKind === "file" ? "Log signal status" : "Code BPM status"}</h2>
          <p className="support-copy">
            {repository.sourceKind === "file"
              ? "Deterministic log metrics and signal pacing derived from severity, cadence, anomaly markers, and the current live-tail capable log source."
              : "Heuristic repository metrics and BPM suggestion from the analyzer pipeline."}
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
          <span>{repository.sourceKind === "file" ? "Mode" : "Build system"}</span>
          <strong>{repository.buildSystem}</strong>
        </div>
        <div>
          <span>Language</span>
          <strong>{repository.primaryLanguage}</strong>
        </div>
        <div>
          <span>{repository.sourceKind === "file" ? "Log lines" : "Java files"}</span>
          <strong>{repository.sourceKind === "file" ? lineCount : repository.javaFileCount}</strong>
        </div>
        <div>
          <span>{repository.sourceKind === "file" ? "Warnings" : "Test files"}</span>
          <strong>
            {repository.sourceKind === "file"
              ? typeof levelCounts?.warn === "number"
                ? levelCounts.warn
                : 0
              : repository.testFileCount}
          </strong>
        </div>
        <div>
          <span>{repository.sourceKind === "file" ? "Errors" : "Storage"}</span>
          <strong>
            {repository.sourceKind === "file"
              ? typeof levelCounts?.error === "number"
                ? levelCounts.error
                : 0
              : repository.storagePath
                ? "Managed snapshot"
                : "Original/remote"}
          </strong>
        </div>
        <div>
          <span>{repository.sourceKind === "file" ? "Anomalies" : "Storage"}</span>
          <strong>
            {repository.sourceKind === "file"
              ? anomalyCount
              : repository.storagePath
                ? "Managed snapshot"
                : "Original/remote"}
          </strong>
        </div>
        {repository.sourceKind !== "file" ? (
          <>
            <div>
              <span>AST parser</span>
              <strong>{astEnabled ? "tree-sitter" : "heuristic"}</strong>
            </div>
            <div>
              <span>AST classes</span>
              <strong>{astClassCount}</strong>
            </div>
            <div>
              <span>AST methods</span>
              <strong>{astMethodCount}</strong>
            </div>
            <div>
              <span>AST endpoints</span>
              <strong>{astEndpointCount}</strong>
            </div>
            {ktEnabled ? (
              <>
                <div>
                  <span>Kotlin classes</span>
                  <strong>{ktClassCount}</strong>
                </div>
                <div>
                  <span>Kotlin functions</span>
                  <strong>{ktFunctionCount}</strong>
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      {hasActiveFilters && repository.sourceKind !== "file" ? (
        <div className="status-stack top-spaced">
          {parseLanguageFilter.length > 0 ? (
            <div className="status-row">
              <span>Language filter</span>
              <strong>{parseLanguageFilter.join(", ")}</strong>
            </div>
          ) : null}
          {parseExtensionFilter.length > 0 ? (
            <div className="status-row">
              <span>Extension filter</span>
              <strong>{parseExtensionFilter.join(", ")}</strong>
            </div>
          ) : null}
        </div>
      ) : null}

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
