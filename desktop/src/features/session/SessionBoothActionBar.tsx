import { SessionBoothActionBarIdle } from "./SessionBoothActionBarIdle";
import { SessionBoothActionBarLive } from "./SessionBoothActionBarLive";
import { SessionBoothActionBarPlayback } from "./SessionBoothActionBarPlayback";
import {
  resolveSessionBoothActionBarMode,
  resolveSessionBoothDirectLaunchDisabled,
  resolveSessionBoothShowReplaySelected,
  resolveSessionBoothShowResumeSelected,
  resolveSessionBoothStartDisabled,
} from "./sessionBoothActionBarRuntime";
import type { SessionBoothActionBarProps } from "./sessionBoothActionBarTypes";

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
      <SessionBoothActionBarPlayback
        mutating={mutating}
        isPlaybackPaused={isPlaybackPaused}
        labels={labels}
        onStepPlaybackWindow={onStepPlaybackWindow}
        onToggleReplayPlayback={onToggleReplayPlayback}
        onStopSession={onStopSession}
      />
    );
  }

  if (mode === "live") {
    return (
      <SessionBoothActionBarLive
        mutating={mutating}
        labels={labels}
        onStopSession={onStopSession}
      />
    );
  }

  return (
    <SessionBoothActionBarIdle
      mutating={mutating}
      directPath={directPath}
      isDirectLoading={isDirectLoading}
      showResumeSelected={showResumeSelected}
      showReplaySelected={showReplaySelected}
      directLaunchDisabled={directLaunchDisabled}
      startDisabled={startDisabled}
      labels={labels}
      onDirectPathChange={onDirectPathChange}
      onDirectLaunch={onDirectLaunch}
      onResumeSelected={onResumeSelected}
      onReplaySelected={onReplaySelected}
      onCreateSession={onCreateSession}
    />
  );
}
