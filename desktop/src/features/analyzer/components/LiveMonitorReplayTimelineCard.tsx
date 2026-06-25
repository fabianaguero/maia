import { useT } from "../../../i18n/I18nContext";

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
  const t = useT();
  const transportDisabled = playbackEventCount <= 1;

  return (
    <div className="audio-path-card audio-path-card--replay top-spaced">
      <span>{t.inspect.replayTimeline}</span>
      <strong>
        {playbackWindowLabel
          ? t.inspect.windowLabel.replace("{window}", playbackWindowLabel)
          : t.inspect.replayTimeline}
      </strong>
      <small>{t.inspect.replayTimelineCopy}</small>
      <div className="replay-transport-row">
        <button
          type="button"
          className="secondary-action"
          onClick={() => onStepWindow(-1)}
          disabled={transportDisabled}
        >
          {t.session.prevWindow}
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={onTogglePause}
          disabled={playbackEventCount <= 0}
        >
          {isPlaybackPaused ? t.session.resumeReplay : t.session.pauseReplay}
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => onStepWindow(1)}
          disabled={transportDisabled}
        >
          {t.session.nextWindow}
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
          aria-label={t.inspect.replayTimeline}
          disabled={transportDisabled}
        />
        <div className="replay-timeline-meta">
          <span>
            {playbackWindowLabel
              ? t.inspect.windowLabel.replace("{window}", playbackWindowLabel)
              : t.inspect.windowZero}
            {isPlaybackPaused ? ` · ${t.inspect.paused}` : ""}
          </span>
          <strong>{playbackPercent}%</strong>
        </div>
      </div>
    </div>
  );
}
