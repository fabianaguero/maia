import type { MetricGridItem } from "./liveLogMonitorDisplayRuntime";

interface LiveLogMonitorMetricGridProps {
  items: MetricGridItem[];
}

export function LiveLogMonitorMetricGrid({ items }: LiveLogMonitorMetricGridProps) {
  return (
    <div className="metric-grid">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
