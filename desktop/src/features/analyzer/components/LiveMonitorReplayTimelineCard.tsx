interface LiveMonitorReplayTimelineCardProps {
  playbackProgress: number;
  playbackPercent: number;
  playbackWindowLabel: string | null;
  isPlaybackPaused: boolean;
  playbackEventCount: number;
  onStepWindow: (direction: -1 | 1) => void;
  onTogglePause: () => void;
  onSeekProgress: (progress: number) => void;
}

export function LiveMonitorReplayTimelineCard({
  playbackProgress,
  playbackPercent,
  playbackWindowLabel,
  isPlaybackPaused,
  playbackEventCount,
  onStepWindow,
  onTogglePause,
  onSeekProgress,
}: LiveMonitorReplayTimelineCardProps) {
  const transportDisabled = playbackEventCount <= 1;

  return (
    <div className="audio-path-card audio-path-card--replay top-spaced">
      <span>Replay timeline</span>
      <strong>{playbackWindowLabel ? `Window ${playbackWindowLabel}` : "Replay timeline"}</strong>
      <small>
        Jump inside the stored session and re-hear how each historical window bent the base track.
      </small>
      <div className="replay-transport-row">
        <button
          type="button"
          className="secondary-action"
          onClick={() => onStepWindow(-1)}
          disabled={transportDisabled}
        >
          Prev window
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={onTogglePause}
          disabled={playbackEventCount <= 0}
        >
          {isPlaybackPaused ? "Resume replay" : "Pause replay"}
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => onStepWindow(1)}
          disabled={transportDisabled}
        >
          Next window
        </button>
      </div>
      <div className="replay-timeline-control">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={playbackProgress}
          onChange={(event) => onSeekProgress(Number(event.target.value))}
          aria-label="Replay timeline"
          disabled={transportDisabled}
        />
        <div className="replay-timeline-meta">
          <span>
            {playbackWindowLabel ?? "Window 0/0"}
            {isPlaybackPaused ? " · paused" : ""}
          </span>
          <strong>{playbackPercent}%</strong>
        </div>
      </div>
    </div>
  );
}
