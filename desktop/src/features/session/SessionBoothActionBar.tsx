import { Pause, Play, Radio, SkipBack, SkipForward } from "lucide-react";

import type { PersistedSession } from "../../api/sessions";
import {
  resolveSessionBoothActionBarMode,
  resolveSessionBoothDirectLaunchDisabled,
  resolveSessionBoothShowReplaySelected,
  resolveSessionBoothShowResumeSelected,
  resolveSessionBoothStartDisabled,
} from "./sessionBoothActionBarRuntime";

interface SessionBoothActionBarProps {
  playbackActive: boolean;
  liveMonitorActive: boolean;
  mutating: boolean;
  readyToRun: boolean;
  isPlaybackPaused: boolean;
  directPath: string;
  isDirectLoading: boolean;
  selectedSession: PersistedSession | null;
  creating: boolean;
  labels: {
    prevWindow: string;
    nextWindow: string;
    resumeReplay: string;
    pauseReplay: string;
    exitReplay: string;
    stopSession: string;
    pastePath: string;
    launching: string;
    launch: string;
    resumeSelected: string;
    replaySelected: string;
    startSession: string;
  };
  onDirectPathChange: (value: string) => void;
  onDirectLaunch: () => void | Promise<void>;
  onResumeSelected: () => void;
  onReplaySelected: () => void | Promise<void>;
  onCreateSession: () => void | Promise<void>;
  onStepPlaybackWindow: (direction: 1 | -1) => void;
  onToggleReplayPlayback: () => void;
  onStopSession: () => void | Promise<void>;
}

export function SessionBoothActionBar({
  playbackActive,
  liveMonitorActive,
  mutating,
  readyToRun,
  isPlaybackPaused,
  directPath,
  isDirectLoading,
  selectedSession,
  creating,
  labels,
  onDirectPathChange,
  onDirectLaunch,
  onResumeSelected,
  onReplaySelected,
  onCreateSession,
  onStepPlaybackWindow,
  onToggleReplayPlayback,
  onStopSession,
}: SessionBoothActionBarProps) {
  const mode = resolveSessionBoothActionBarMode({
    playbackActive,
    liveMonitorActive,
  });
  const showResumeSelected = resolveSessionBoothShowResumeSelected(selectedSession);
  const showReplaySelected = resolveSessionBoothShowReplaySelected(selectedSession);
  const directLaunchDisabled = resolveSessionBoothDirectLaunchDisabled({
    directPath,
    isDirectLoading,
  });
  const startDisabled = resolveSessionBoothStartDisabled({
    creating,
    mutating,
    readyToRun,
  });

  if (mode === "playback") {
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

  if (mode === "live") {
    return (
      <div className="session-booth-actions">
        <button type="button" className="action" onClick={onStopSession} disabled={mutating}>
          <Pause size={14} />
          {labels.stopSession}
        </button>
      </div>
    );
  }

  return (
    <div className="session-booth-actions">
      <div className="direct-feed-input-group">
        <input
          type="text"
          className="direct-feed-input"
          placeholder={labels.pastePath}
          value={directPath}
          onChange={(event) => onDirectPathChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onDirectLaunch()}
        />
        <button
          className="direct-launch-btn"
          onClick={onDirectLaunch}
          disabled={directLaunchDisabled}
        >
          {isDirectLoading ? labels.launching : labels.launch}
        </button>
      </div>
      {showResumeSelected ? (
        <button
          type="button"
          className="secondary-action"
          onClick={onResumeSelected}
          disabled={mutating}
        >
          <Play size={14} />
          {labels.resumeSelected}
        </button>
      ) : null}
      {showReplaySelected ? (
        <button
          type="button"
          className="secondary-action"
          onClick={onReplaySelected}
          disabled={mutating}
        >
          <Radio size={14} />
          {labels.replaySelected}
        </button>
      ) : null}
      <button
        type="button"
        className="action"
        onClick={onCreateSession}
        disabled={startDisabled}
      >
        <Play size={14} />
        {labels.startSession}
      </button>
    </div>
  );
}
