import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

import type { SessionBoothActionBarPlaybackProps } from "./sessionBoothActionBarTypes";

export function SessionBoothActionBarPlayback({
  mutating,
  isPlaybackPaused,
  labels,
  onStepPlaybackWindow,
  onToggleReplayPlayback,
  onStopSession,
}: SessionBoothActionBarPlaybackProps) {
  return (
    <div className="session-booth-actions">
      <button
        type="button"
        className="secondary-action"
        onClick={() => onStepPlaybackWindow(-1)}
        disabled={mutating}
      >
        <SkipBack size={14} />
        {labels.prevWindow}
      </button>
      <button
        type="button"
        className="secondary-action"
        onClick={onToggleReplayPlayback}
        disabled={mutating}
      >
        {isPlaybackPaused ? <Play size={14} /> : <Pause size={14} />}
        {isPlaybackPaused ? labels.resumeReplay : labels.pauseReplay}
      </button>
      <button
        type="button"
        className="secondary-action"
        onClick={() => onStepPlaybackWindow(1)}
        disabled={mutating}
      >
        <SkipForward size={14} />
        {labels.nextWindow}
      </button>
      <button type="button" className="action" onClick={onStopSession} disabled={mutating}>
        <Pause size={14} />
        {labels.exitReplay}
      </button>
    </div>
  );
}
