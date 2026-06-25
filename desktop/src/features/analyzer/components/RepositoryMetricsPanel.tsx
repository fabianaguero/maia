import type { RepositoryAnalysis } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";

interface RepositoryMetricsPanelProps {
  repository: RepositoryAnalysis;
  analyzerLabel: string;
}

export function RepositoryMetricsPanel({ repository, analyzerLabel }: RepositoryMetricsPanelProps) {
  const t = useT();
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
    typeof repository.metrics.astClassCount === "number" ? repository.metrics.astClassCount : 0;
  const astMethodCount =
    typeof repository.metrics.astMethodCount === "number" ? repository.metrics.astMethodCount : 0;
  const astEndpointCount =
    typeof repository.metrics.astEndpointAnnotationCount === "number"
      ? repository.metrics.astEndpointAnnotationCount
      : 0;
  const ktEnabled = repository.metrics.ktAstEnabled === true;
  const ktClassCount =
    typeof repository.metrics.ktAstClassCount === "number" ? repository.metrics.ktAstClassCount : 0;
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
          <h2>
            {repository.sourceKind === "file" ? t.inspect.logSignalStatus : t.inspect.codeBpmStatus}
          </h2>
          <p className="support-copy">
            {repository.sourceKind === "file"
              ? t.inspect.logSignalStatusCopy
              : t.inspect.codeBpmStatusCopy}
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>{t.inspect.suggestedBpm}</span>
          <strong>
            {repository.suggestedBpm ? Math.round(repository.suggestedBpm) : t.inspect.pending}
          </strong>
        </div>
        <div>
          <span>{t.session.confidence}</span>
          <strong>{Math.round(repository.confidence * 100)}%</strong>
        </div>
        <div>
          <span>{repository.sourceKind === "file" ? t.inspect.mode : t.inspect.buildSystem}</span>
          <strong>{repository.buildSystem}</strong>
        </div>
        <div>
          <span>{t.inspect.language}</span>
          <strong>{repository.primaryLanguage}</strong>
        </div>
        <div>
          <span>{repository.sourceKind === "file" ? t.inspect.logLines : t.inspect.javaFiles}</span>
          <strong>{repository.sourceKind === "file" ? lineCount : repository.javaFileCount}</strong>
        </div>
        <div>
          <span>{repository.sourceKind === "file" ? t.inspect.warnings : t.inspect.testFiles}</span>
          <strong>
            {repository.sourceKind === "file"
              ? typeof levelCounts?.warn === "number"
                ? levelCounts.warn
                : 0
              : repository.testFileCount}
          </strong>
        </div>
        <div>
          <span>{repository.sourceKind === "file" ? t.inspect.errors : t.inspect.storage}</span>
          <strong>
            {repository.sourceKind === "file"
              ? typeof levelCounts?.error === "number"
                ? levelCounts.error
                : 0
              : repository.storagePath
                ? t.inspect.managedSnapshot
                : t.inspect.originalRemote}
          </strong>
        </div>
        <div>
          <span>
            {repository.sourceKind === "file" ? t.session.anomaliesDetected : t.inspect.storage}
          </span>
          <strong>
            {repository.sourceKind === "file"
              ? anomalyCount
              : repository.storagePath
                ? t.inspect.managedSnapshot
                : t.inspect.originalRemote}
          </strong>
        </div>
        {repository.sourceKind !== "file" ? (
          <>
            <div>
              <span>{t.inspect.astParser}</span>
              <strong>{astEnabled ? "tree-sitter" : "heuristic"}</strong>
            </div>
            <div>
              <span>{t.inspect.astClasses}</span>
              <strong>{astClassCount}</strong>
            </div>
            <div>
              <span>{t.inspect.astMethods}</span>
              <strong>{astMethodCount}</strong>
            </div>
            <div>
              <span>{t.inspect.astEndpoints}</span>
              <strong>{astEndpointCount}</strong>
            </div>
            {ktEnabled ? (
              <>
                <div>
                  <span>{t.inspect.kotlinClasses}</span>
                  <strong>{ktClassCount}</strong>
                </div>
                <div>
                  <span>{t.inspect.kotlinFunctions}</span>
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
              <span>{t.inspect.languageFilter}</span>
              <strong>{parseLanguageFilter.join(", ")}</strong>
            </div>
          ) : null}
          {parseExtensionFilter.length > 0 ? (
            <div className="status-row">
              <span>{t.inspect.extensionFilter}</span>
              <strong>{parseExtensionFilter.join(", ")}</strong>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="status-stack top-spaced">
        <div className="status-row">
          <span>{t.inspect.analyzerStatus}</span>
          <strong>{repository.analyzerStatus}</strong>
        </div>
        <div className="status-row">
          <span>{t.inspect.bridge}</span>
          <strong>{analyzerLabel}</strong>
        </div>
      </div>
    </section>
  );
}
