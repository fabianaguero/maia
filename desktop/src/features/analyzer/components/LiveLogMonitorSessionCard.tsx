import type { SessionCardDisplay } from "./liveLogMonitorDisplayRuntime";

interface LiveLogMonitorSessionCardProps {
  replayActive: boolean;
  replayProgressAria: string;
  playbackPercent: number | null;
  repoTitle: string;
  display: SessionCardDisplay;
}

export function LiveLogMonitorSessionCard({
  replayActive,
  replayProgressAria,
  playbackPercent,
  repoTitle,
  display,
}: LiveLogMonitorSessionCardProps) {
  return (
    <div className={`audio-path-card${replayActive ? " audio-path-card--replay" : ""}`}>
      <span>{display.title}</span>
      <strong>{repoTitle}</strong>
      <small>{display.sourceSummary}</small>
      {replayActive && playbackPercent !== null ? (
        <div
          className="monitor-progress-track"
          role="progressbar"
          aria-label={replayProgressAria}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={playbackPercent}
        >
          <span style={{ width: `${playbackPercent}%` }} />
        </div>
      ) : null}
      {display.replayProgressSummary ? <small>{display.replayProgressSummary}</small> : null}
    </div>
  );
}
