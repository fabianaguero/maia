import type { BaseAssetRecord } from "../../../types/library";

interface BaseAssetMetricsPanelProps {
  baseAsset: BaseAssetRecord;
  analyzerLabel: string;
}

function formatBytes(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Unknown";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function BaseAssetMetricsPanel({
  baseAsset,
  analyzerLabel,
}: BaseAssetMetricsPanelProps) {
  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>Base asset status</h2>
          <p className="support-copy">
            Metadata snapshot for the reusable asset reference stored locally in Maia.
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>Category</span>
          <strong>{baseAsset.categoryLabel}</strong>
        </div>
        <div>
          <span>Reusable</span>
          <strong>{baseAsset.reusable ? "Yes" : "Reference only"}</strong>
        </div>
        <div>
          <span>Source kind</span>
          <strong>{baseAsset.sourceKind === "directory" ? "Folder pack" : "Single file"}</strong>
        </div>
        <div>
          <span>Entries</span>
          <strong>{baseAsset.entryCount}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{Math.round(baseAsset.confidence * 100)}%</strong>
        </div>
        <div>
          <span>Size</span>
          <strong>{formatBytes(baseAsset.metrics.totalSizeBytes)}</strong>
        </div>
      </div>

      <div className="status-stack top-spaced">
        <div className="status-row">
          <span>Analyzer status</span>
          <strong>{baseAsset.analyzerStatus}</strong>
        </div>
        <div className="status-row">
          <span>Checksum</span>
          <strong>{baseAsset.checksum ?? "Pending"}</strong>
        </div>
        <div className="status-row">
          <span>Bridge</span>
          <strong>{analyzerLabel}</strong>
        </div>
      </div>
    </section>
  );
}
