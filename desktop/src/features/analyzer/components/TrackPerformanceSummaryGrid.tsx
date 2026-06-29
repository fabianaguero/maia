import type { TrackPerformanceMetricViewModel } from "./trackPerformancePanelRuntime";

interface TrackPerformanceSummaryGridProps {
  metrics: TrackPerformanceMetricViewModel[];
}

export function TrackPerformanceSummaryGrid({ metrics }: TrackPerformanceSummaryGridProps) {
  return (
    <div className="metric-grid">
      {metrics.map((metric) => (
        <div key={metric.key}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </div>
      ))}
    </div>
  );
}
