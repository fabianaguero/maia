import type { BaseAssetRecord } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";

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

export function BaseAssetMetricsPanel({ baseAsset, analyzerLabel }: BaseAssetMetricsPanelProps) {
  const t = useT();
  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.inspect.baseAssetStatus}</h2>
          <p className="support-copy">{t.inspect.baseAssetStatusCopy}</p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>{t.inspect.category}</span>
          <strong>{baseAsset.categoryLabel}</strong>
        </div>
        <div>
          <span>{t.inspect.reusable}</span>
          <strong>{baseAsset.reusable ? t.inspect.yes : t.inspect.singleUse}</strong>
        </div>
        <div>
          <span>{t.inspect.sourceKind}</span>
          <strong>
            {baseAsset.sourceKind === "directory" ? t.inspect.folderPack : t.inspect.singleFile}
          </strong>
        </div>
        <div>
          <span>{t.inspect.entries}</span>
          <strong>{baseAsset.entryCount}</strong>
        </div>
        <div>
          <span>{t.session.confidence}</span>
          <strong>{Math.round(baseAsset.confidence * 100)}%</strong>
        </div>
        <div>
          <span>{t.inspect.audioEntries}</span>
          <strong>
            {typeof baseAsset.metrics.audioEntryCount === "number"
              ? baseAsset.metrics.audioEntryCount
              : 0}
          </strong>
        </div>
        <div>
          <span>{t.inspect.size}</span>
          <strong>{formatBytes(baseAsset.metrics.totalSizeBytes)}</strong>
        </div>
      </div>

      <div className="status-stack top-spaced">
        <div className="status-row">
          <span>{t.inspect.analyzerStatus}</span>
          <strong>{baseAsset.analyzerStatus}</strong>
        </div>
        <div className="status-row">
          <span>{t.inspect.checksum}</span>
          <strong>{baseAsset.checksum ?? t.inspect.pending}</strong>
        </div>
        <div className="status-row">
          <span>{t.inspect.bridge}</span>
          <strong>{analyzerLabel}</strong>
        </div>
      </div>
    </section>
  );
}
