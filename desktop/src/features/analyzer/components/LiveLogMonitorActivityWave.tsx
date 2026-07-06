import {
  buildHorizontalTailCellStyle,
  buildLiveWaveBarStyle,
} from "./liveLogMonitorActivityPanelViewRuntime";
import type { LiveLogMonitorActivityLabels } from "./liveLogMonitorActivityPanelTypes";
import type { RoutedLiveCue } from "./liveSonificationScene";

interface LiveLogMonitorActivityWaveProps {
  recentCues: RoutedLiveCue[];
  isTropicalTheme: boolean;
  maxRecentCues: number;
  labels: LiveLogMonitorActivityLabels;
}

export function LiveLogMonitorActivityWave({
  recentCues,
  isTropicalTheme,
  maxRecentCues,
  labels,
}: LiveLogMonitorActivityWaveProps) {
  return (
    <>
      <div className={`live-scrolling-wave ${isTropicalTheme ? "tropical-theme" : ""}`}>
        {recentCues.map((cue, index) => (
          <div
            key={`${cue.id}-${index}`}
            className={`live-wave-bar ${cue.routeKey}${cue.accent === "anomaly" ? " is-anomaly" : ""}`}
            title={`${cue.component} · ${cue.excerpt}`}
            style={buildLiveWaveBarStyle(cue, index, maxRecentCues)}
          />
        ))}
        {recentCues.length === 0 ? (
          <div className="live-wave-placeholder">{labels.awaitingSystemPulse}</div>
        ) : null}
      </div>

      <div className="monitor-recent-horizontal-tail">
        {recentCues.map((cue, index) => (
          <div
            key={`tail-${cue.id}-${index}`}
            className={`monitor-horizontal-tail-cell is-${cue.routeKey}`}
            style={buildHorizontalTailCellStyle(index, maxRecentCues)}
          >
            {cue.logLine ? (
              <div className="monitor-horizontal-tail-text">
                <span className="tail-component">[{cue.component}]</span> {cue.logLine}
              </div>
            ) : (
              <div className="monitor-horizontal-tail-empty">{labels.idleUpper}</div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
