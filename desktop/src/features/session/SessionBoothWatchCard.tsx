import { Activity, AlertCircle, TrendingUp } from "lucide-react";

import type { LiveLogStreamUpdate } from "../../types/monitor";
import { formatMonitorLevel } from "./sessionDisplay";
import type { SessionBoothViewModel } from "./sessionBoothViewModel";

interface SessionBoothWatchCardProps {
  booth: SessionBoothViewModel;
  latestUpdate: LiveLogStreamUpdate | null;
  playbackActive: boolean;
  readyToRun: boolean;
  labels: {
    replayNotes: string;
    watchouts: string;
    latestWindowAnomalies: string;
    noCurrentBurst: string;
    awaitingInput: string;
    runBoothHint: string;
    sourceActiveHint: string;
  };
}

export function SessionBoothWatchCard({
  booth,
  latestUpdate,
  playbackActive,
  readyToRun,
  labels,
}: SessionBoothWatchCardProps) {
  return (
    <section className="session-booth-card">
      <div className="session-booth-card-header">
        <strong>{playbackActive ? labels.replayNotes : labels.watchouts}</strong>
        <span>
          {latestUpdate?.anomalyCount
            ? labels.latestWindowAnomalies.replace("{count}", String(latestUpdate.anomalyCount))
            : labels.noCurrentBurst}
        </span>
      </div>
      {booth.warningItems.length > 0 || booth.anomalyMarkers.length > 0 ? (
        <div className="session-booth-list">
          {booth.warningItems.map((warning) => (
            <div key={warning} className="session-booth-list-item">
              <AlertCircle size={14} />
              <span>{warning}</span>
            </div>
          ))}
          {booth.anomalyMarkers.map((marker) => (
            <div
              key={`${marker.eventIndex}-${marker.component}-${marker.excerpt}`}
              className="session-booth-list-item"
            >
              <TrendingUp size={14} />
              <span>
                {formatMonitorLevel(marker.level, labels.awaitingInput)} · {marker.component} ·{" "}
                {marker.excerpt}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="session-booth-list-item muted">
          <Activity size={14} />
          <span>{readyToRun ? labels.runBoothHint : labels.sourceActiveHint}</span>
        </div>
      )}
    </section>
  );
}
