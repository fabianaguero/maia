import type { CompositionResultRecord } from "../../../types/library";

interface CompositionMetricsPanelProps {
  composition: CompositionResultRecord;
  analyzerLabel: string;
}

function metricNumber(
  metrics: Record<string, unknown>,
  key: string,
): number | null {
  const value = metrics[key];
  return typeof value === "number" ? value : null;
}

function metricString(
  metrics: Record<string, unknown>,
  key: string,
): string | null {
  const value = metrics[key];
  return typeof value === "string" ? value : null;
}

function metricArrayLength(
  metrics: Record<string, unknown>,
  key: string,
): number | null {
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
  return (
    <section className="panel metric-panel">
      <div className="panel-header compact">
        <div>
          <h2>Composition metrics</h2>
          <p className="support-copy">
            Target tempo, preview scope, and reuse confidence.
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <div>
          <span>Target BPM</span>
          <strong>{composition.targetBpm.toFixed(0)}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{Math.round(composition.confidence * 100)}%</strong>
        </div>
        <div>
          <span>Intensity</span>
          <strong>{metricString(composition.metrics, "intensityBand") ?? "unknown"}</strong>
        </div>
        <div>
          <span>Recommended layers</span>
          <strong>{metricNumber(composition.metrics, "recommendedLayerCount") ?? "?"}</strong>
        </div>
        <div>
          <span>Preview duration</span>
          <strong>
            {metricNumber(composition.metrics, "previewDurationSeconds")?.toFixed(1) ?? "?"}s
          </strong>
        </div>
        <div>
          <span>Sections</span>
          <strong>{metricArrayLength(composition.metrics, "arrangementSections") ?? 4}</strong>
        </div>
        <div>
          <span>Render stems</span>
          <strong>{nestedMetricArrayLength(composition.metrics, "renderPreview", "stems") ?? 3}</strong>
        </div>
        <div>
          <span>Headroom</span>
          <strong>
            {nestedMetricNumber(composition.metrics, "renderPreview", "headroomDb")?.toFixed(1) ??
              "-6.0"}{" "}
            dB
          </strong>
        </div>
        <div>
          <span>Analyzer</span>
          <strong>{analyzerLabel}</strong>
        </div>
      </div>
    </section>
  );
}
