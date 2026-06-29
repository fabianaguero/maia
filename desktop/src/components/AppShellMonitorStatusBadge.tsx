import { Dot } from "lucide-react";

export interface AppShellMonitorStatusBadgeProps {
  liveStatusLabel: string;
  anomaliesInlineLabel: string;
  anomalies?: number;
  uptime?: string;
  source?: string;
  inspectLabel: string;
  stopLabel: string;
  onInspect?: () => void;
  onStopMonitoring?: () => void;
}

export function AppShellMonitorStatusBadge({
  liveStatusLabel,
  anomaliesInlineLabel,
  anomalies = 0,
  uptime = "00:00",
  source,
  inspectLabel,
  stopLabel,
  onInspect,
  onStopMonitoring,
}: AppShellMonitorStatusBadgeProps) {
  return (
    <div className="monitor-status-badge">
      <div className="monitor-status-badge__header">
        <div className="monitor-status-badge__state">
          <Dot size={8} className="pulsing-dot" />
          <span className="status-label">{liveStatusLabel}</span>
        </div>
        <div className="status-metrics">
          <span className="metric-anomalies">
            {anomalies} {anomaliesInlineLabel}
          </span>
          <span className="metric-uptime">{uptime}</span>
        </div>
      </div>
      {source ? <span className="status-source">{source}</span> : null}
      <div className="monitor-status-badge__actions">
        <button type="button" className="btn-inspect-small" onClick={() => onInspect?.()}>
          {inspectLabel}
        </button>
        <button type="button" className="btn-stop-small" onClick={() => onStopMonitoring?.()}>
          {stopLabel}
        </button>
      </div>
    </div>
  );
}
