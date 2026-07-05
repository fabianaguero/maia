import { AlertCircle, Clock, TrendingUp } from "lucide-react";

interface SessionSavedSessionCardMetricsProps {
  pollsValue: number;
  linesValue: number;
  anomaliesValue: number;
  bpmLabel: string;
  templateLabel: string;
  pollsLabel: string;
  linesLabel: string;
  anomaliesLabel: string;
}

export function SessionSavedSessionCardMetrics({
  pollsValue,
  linesValue,
  anomaliesValue,
  bpmLabel,
  templateLabel,
  pollsLabel,
  linesLabel,
  anomaliesLabel,
}: SessionSavedSessionCardMetricsProps) {
  return (
    <div className="session-card-metrics">
      <div className="session-metric">
        <TrendingUp size={12} />
        <span>
          {pollsValue} {pollsLabel}
        </span>
      </div>
      <div className="session-metric">
        <Clock size={12} />
        <span>
          {linesValue} {linesLabel}
        </span>
      </div>
      <div className="session-metric">
        <AlertCircle size={12} />
        <span>
          {anomaliesValue} {anomaliesLabel}
        </span>
      </div>
      <div className="session-metric">
        <span className="session-chip">{bpmLabel}</span>
      </div>
      <div className="session-metric">
        <span className="session-chip">{templateLabel}</span>
      </div>
    </div>
  );
}
