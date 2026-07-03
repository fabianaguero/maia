import { formatFrequency } from "./liveLogMonitorPanelRuntime";
import type { LiveLogMonitorPerformanceSummaryLabels } from "./liveLogMonitorPerformanceSummaryTypes";
import type { RoutedLiveCue } from "./liveSonificationScene";

interface LiveLogMonitorRecentCuesProps {
  recentCues: RoutedLiveCue[];
  labels: LiveLogMonitorPerformanceSummaryLabels;
}

export function LiveLogMonitorRecentCues({ recentCues, labels }: LiveLogMonitorRecentCuesProps) {
  if (recentCues.length === 0) {
    return (
      <div className="empty-state">
        <p>{labels.noLiveCues}</p>
      </div>
    );
  }

  return (
    <div className="cue-pill-strip">
      {recentCues.map((cue) => (
        <article key={cue.id} className="cue-pill">
          <span>
            {cue.level} · {cue.waveform} · {cue.routeLabel}
          </span>
          <strong>{cue.component}</strong>
          <small>
            {formatFrequency(cue.noteHz)} · {cue.durationMs} ms
          </small>
          <small>
            {cue.stemLabel} · {cue.sectionLabel}
          </small>
        </article>
      ))}
    </div>
  );
}
