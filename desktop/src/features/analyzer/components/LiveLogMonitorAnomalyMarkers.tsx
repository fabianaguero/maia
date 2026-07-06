import type { LiveLogMarker } from "../../../types/library";
import type { LiveLogMonitorActivityLabels } from "./liveLogMonitorActivityPanelTypes";

interface LiveLogMonitorAnomalyMarkersProps {
  waveAnomalyMarkers: LiveLogMarker[];
  labels: LiveLogMonitorActivityLabels;
}

export function LiveLogMonitorAnomalyMarkers({
  waveAnomalyMarkers,
  labels,
}: LiveLogMonitorAnomalyMarkersProps) {
  return (
    <div className="live-wave-anomaly-strip">
      <div className="monitor-parsed-lines-head">
        <span>{labels.waveAnomalyMarkers}</span>
        <strong>{waveAnomalyMarkers.length}/4</strong>
      </div>
      {waveAnomalyMarkers.length > 0 ? (
        <div className="live-wave-anomaly-chip-list">
          {waveAnomalyMarkers.map((marker, index) => (
            <div key={`${marker.eventIndex}-${index}`} className="live-wave-anomaly-chip">
              <span className="live-wave-anomaly-chip-level">{marker.level.toUpperCase()}</span>
              <span className="live-wave-anomaly-chip-component">{marker.component}</span>
              <code className="live-wave-anomaly-chip-excerpt">{marker.excerpt}</code>
            </div>
          ))}
        </div>
      ) : (
        <p className="monitor-empty-hint">{labels.noAnomalyMarkersLatestWindows}</p>
      )}
    </div>
  );
}
