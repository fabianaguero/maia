import type { CSSProperties } from "react";
import type { RepositoryAnalysis } from "../../../types/library";

interface LogSignalPanelProps {
  repository: RepositoryAnalysis;
}

interface AnomalyMarker {
  lineNumber: number;
  level: string;
  component: string;
  excerpt: string;
}

function numberMetric(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function cadenceBins(metrics: Record<string, unknown>): number[] {
  const raw = metrics.logCadenceBins;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((value): value is number => typeof value === "number");
}

function anomalyMarkers(metrics: Record<string, unknown>): AnomalyMarker[] {
  const raw = metrics.anomalyMarkers;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((marker) => {
    if (!marker || typeof marker !== "object") {
      return [];
    }

    const record = marker as Record<string, unknown>;
    if (
      typeof record.lineNumber !== "number" ||
      typeof record.level !== "string" ||
      typeof record.component !== "string" ||
      typeof record.excerpt !== "string"
    ) {
      return [];
    }

    return [
      {
        lineNumber: record.lineNumber,
        level: record.level,
        component: record.component,
        excerpt: record.excerpt,
      },
    ];
  });
}

function topComponents(metrics: Record<string, unknown>): Array<{ component: string; count: number }> {
  const raw = metrics.topComponents;
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    if (typeof record.component !== "string" || typeof record.count !== "number") {
      return [];
    }

    return [{ component: record.component, count: record.count }];
  });
}

function levelCounts(metrics: Record<string, unknown>): Record<string, number> {
  const raw = metrics.levelCounts;
  if (!raw || typeof raw !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).flatMap(([key, value]) =>
      typeof value === "number" ? [[key, value]] : [],
    ),
  );
}

export function LogSignalPanel({ repository }: LogSignalPanelProps) {
  const metrics = repository.metrics as Record<string, unknown>;
  const bins = cadenceBins(metrics);
  const markers = anomalyMarkers(metrics);
  const components = topComponents(metrics);
  const levels = levelCounts(metrics);
  const anomalyCount = numberMetric(metrics.anomalyCount);
  const lineCount = numberMetric(metrics.lineCount);
  const timestampedLineCount = numberMetric(metrics.timestampedLineCount);
  const dominantLevel =
    typeof metrics.dominantLevel === "string" ? metrics.dominantLevel : "unknown";
  const normalizedBins =
    bins.length > 0
      ? bins
      : Array.from({ length: 16 }, (_, index) => Number((0.25 + ((index % 5) + 1) / 8).toFixed(3)));

  return (
    <section className="panel waveform-panel">
      <div className="panel-header">
        <div>
          <h2>Log signal map</h2>
          <p className="support-copy">
            Maia translates log cadence, severity pressure, and anomaly spikes into a deterministic
            musical signal profile.
          </p>
        </div>
      </div>

      <div className="log-cadence-stage">
        <div
          className="log-cadence-bars"
          style={{
            gridTemplateColumns: `repeat(${normalizedBins.length}, minmax(0, 1fr))`,
          } as CSSProperties}
        >
          {normalizedBins.map((bin, index) => (
            <span
              key={`${index}-${bin}`}
              className="log-cadence-bar"
              style={{ "--log-bar-scale": String(bin) } as CSSProperties}
            />
          ))}
        </div>
      </div>

      <div className="waveform-summary">
        <div className="waveform-meta-pill">
          <span>Lines</span>
          <strong>{lineCount}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>Anomalies</span>
          <strong>{anomalyCount}</strong>
        </div>
        <div className="waveform-meta-pill">
          <span>Dominant level</span>
          <strong>{dominantLevel}</strong>
        </div>
      </div>

      <div className="metric-grid top-spaced">
        <div>
          <span>Errors</span>
          <strong>{levels.error ?? 0}</strong>
        </div>
        <div>
          <span>Warnings</span>
          <strong>{levels.warn ?? 0}</strong>
        </div>
        <div>
          <span>Info</span>
          <strong>{levels.info ?? 0}</strong>
        </div>
        <div>
          <span>Timestamped</span>
          <strong>{timestampedLineCount}</strong>
        </div>
      </div>

      {components.length > 0 ? (
        <>
          <div className="panel-header compact top-spaced">
            <div>
              <h2>Hot components</h2>
              <p className="support-copy">
                Most active sources in the current log signal profile.
              </p>
            </div>
          </div>
          <div className="pill-strip">
            {components.map((component) => (
              <span key={component.component}>
                {component.component} · {component.count}
              </span>
            ))}
          </div>
        </>
      ) : null}

      <div className="panel-header compact top-spaced">
        <div>
          <h2>Anomaly markers</h2>
          <p className="support-copy">
            Markers Maia also maps to distinct sonic accents during live monitoring.
          </p>
        </div>
      </div>

      {markers.length > 0 ? (
        <ul className="stack-list">
          {markers.map((marker) => (
            <li key={`${marker.lineNumber}-${marker.component}-${marker.level}`}>
              <strong>
                Line {marker.lineNumber} · {marker.level} · {marker.component}
              </strong>
              <small>{marker.excerpt}</small>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <p>No anomaly markers were emitted for this log source.</p>
        </div>
      )}
    </section>
  );
}
