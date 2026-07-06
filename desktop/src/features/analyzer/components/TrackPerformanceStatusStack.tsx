import type { TrackPerformanceCueLoopStatusRowViewModel } from "./trackPerformanceCueLoopSectionRuntime";

interface TrackPerformanceStatusStackProps {
  rows: TrackPerformanceCueLoopStatusRowViewModel[];
}

export function TrackPerformanceStatusStack({ rows }: TrackPerformanceStatusStackProps) {
  return (
    <div className="status-stack">
      {rows.map((row) => (
        <div key={row.key} className="status-row">
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}
