import type { LiveLogMarker } from "../../../types/library";
import { markerKey } from "./liveLogMonitorPerformanceSummaryRuntime";
import type { LiveLogMonitorPerformanceSummaryLabels } from "./liveLogMonitorPerformanceSummaryTypes";

interface LiveLogMonitorRecentMarkersProps {
  recentMarkers: LiveLogMarker[];
  labels: LiveLogMonitorPerformanceSummaryLabels;
}

export function LiveLogMonitorRecentMarkers({
  recentMarkers,
  labels,
}: LiveLogMonitorRecentMarkersProps) {
  if (recentMarkers.length === 0) {
    return (
      <div className="empty-state">
        <p>{labels.noAnomalyMarkersSession}</p>
      </div>
    );
  }

  return (
    <ul className="stack-list">
      {recentMarkers.map((marker) => (
        <li key={markerKey(marker)}>
          <strong>
            {labels.eventLabel.replace("{index}", String(marker.eventIndex))} · {marker.level} ·{" "}
            {marker.component}
          </strong>
          <small>{marker.excerpt}</small>
        </li>
      ))}
    </ul>
  );
}
