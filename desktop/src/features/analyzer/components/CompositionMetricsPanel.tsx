import type { CompositionResultRecord } from "../../../types/library";
import { useT } from "../../../i18n/I18nContext";

interface CompositionMetricsPanelProps {
  composition: CompositionResultRecord;
  analyzerLabel: string;
}

function metricNumber(metrics: Record<string, unknown>, key: string): number | null {
  const value = metrics[key];
  return typeof value === "number" ? value : null;
}

function metricString(metrics: Record<string, unknown>, key: string): string | null {
  const value = metrics[key];
  return typeof value === "string" ? value : null;
}

function metricArrayLength(metrics: Record<string, unknown>, key: string): number | null {
  const value = metrics[key];
  return Array.isArray(value) ? value.length : null;
}

function nestedMetricNumber(
  metrics: Record<string, unknown>,
  key: string,
  nestedKey: string,
): number | null {
  const value = metrics[key];
  if (!value || typeof value !== "object") {
    return null;
  }

  return metricNumber(value as Record<string, unknown>, nestedKey);
}

function nestedMetricArrayLength(
  metrics: Record<string, unknown>,
  key: string,
  nestedKey: string,
): number | null {
  const value = metrics[key];
  if (!value || typeof value !== "object") {
    return null;
  }

  return metricArrayLength(value as Record<string, unknown>, nestedKey);
}

export function CompositionMetricsPanel({
  composition,
  analyzerLabel,
}: CompositionMetricsPanelProps) {
  const t = useT();
  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>{t.compose.compositionMetrics}</h2>
          <p className="support-copy">{t.compose.compositionMetricsCopy}</p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>{t.compose.targetBpm}</span>
          <strong>{composition.targetBpm.toFixed(0)}</strong>
        </div>
        <div>
          <span>{t.session.confidence}</span>
          <strong>{Math.round(composition.confidence * 100)}%</strong>
        </div>
        <div>
          <span>{t.compose.intensity}</span>
          <strong>{metricString(composition.metrics, "intensityBand") ?? t.inspect.unknown}</strong>
        </div>
        <div>
          <span>{t.compose.recommendedLayers}</span>
          <strong>{metricNumber(composition.metrics, "recommendedLayerCount") ?? "?"}</strong>
        </div>
        <div>
          <span>{t.compose.previewDuration}</span>
          <strong>
            {metricNumber(composition.metrics, "previewDurationSeconds")?.toFixed(1) ?? "?"}s
          </strong>
        </div>
        <div>
          <span>{t.compose.sections}</span>
          <strong>{metricArrayLength(composition.metrics, "arrangementSections") ?? 4}</strong>
        </div>
        <div>
          <span>{t.compose.renderStems}</span>
          <strong>
            {nestedMetricArrayLength(composition.metrics, "renderPreview", "stems") ?? 3}
          </strong>
        </div>
        <div>
          <span>{t.compose.headroom}</span>
          <strong>
            {nestedMetricNumber(composition.metrics, "renderPreview", "headroomDb")?.toFixed(1) ??
              "-6.0"}{" "}
            dB
          </strong>
        </div>
        <div>
          <span>{t.compose.analyzer}</span>
          <strong>{analyzerLabel}</strong>
        </div>
      </div>
    </section>
  );
}
