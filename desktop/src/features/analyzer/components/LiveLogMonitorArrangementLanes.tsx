import type { ArrangementVoice } from "./liveSonificationScene";
import type { LiveLogMonitorPerformanceSummaryLabels } from "./liveLogMonitorPerformanceSummaryTypes";
import { buildArrangementLanes } from "./liveLogMonitorPerformanceSummaryRuntime";

interface LiveLogMonitorArrangementLanesProps {
  recentVoices: ArrangementVoice[];
  labels: LiveLogMonitorPerformanceSummaryLabels;
}

export function LiveLogMonitorArrangementLanes({
  recentVoices,
  labels,
}: LiveLogMonitorArrangementLanesProps) {
  if (recentVoices.length === 0) {
    return (
      <div className="empty-state">
        <p>{labels.noArrangementVoices}</p>
      </div>
    );
  }

  return (
    <div className="arrangement-lane-grid">
      {buildArrangementLanes(recentVoices).map((lane) => (
        <div key={lane.track} className={`arrangement-lane arrangement-lane--${lane.track}`}>
          <span className="arrangement-lane-label">{lane.track}</span>
          <div className="arrangement-lane-chips">
            {lane.voices.map((voice, index) => (
              <span key={`${lane.track}-${index}`} className="arrangement-lane-chip">
                {voice.cue.component} · {voice.cue.routeLabel}
              </span>
            ))}
            {lane.voices.length === 0 ? <span className="arrangement-lane-empty">—</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
