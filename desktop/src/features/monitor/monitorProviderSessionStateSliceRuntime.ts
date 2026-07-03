import type { SessionEvent } from "../../api/sessions";
import type { GuideTrackPCM, CrossfadeHandle } from "./monitorAudioRuntimeTypes";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";

export function buildMonitorProviderSessionStateSlice(input: {
  sessionRef: React.MutableRefObject<ActiveMonitorSession | null>;
  setSession: React.Dispatch<React.SetStateAction<ActiveMonitorSession | null>>;
  setIsPlayback: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPlaybackPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setMetrics: React.Dispatch<React.SetStateAction<MonitorMetrics>>;
  isPlayback: boolean;
}): UseMonitorProviderSessionActionsInput["session"] {
  return {
    sessionRef: input.sessionRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    setMetrics: input.setMetrics,
    isPlayback: input.isPlayback,
  };
}

export function buildMonitorProviderSessionLiveSlice(input: {
  activeRef: React.MutableRefObject<boolean>;
  isPlaybackRef: React.MutableRefObject<boolean>;
  directCursorRef: React.MutableRefObject<number | undefined>;
  emptyWindowsRef: React.MutableRefObject<number>;
  pollTimerRef: React.MutableRefObject<number | null>;
}): UseMonitorProviderSessionActionsInput["live"] {
  return {
    activeRef: input.activeRef,
    isPlaybackRef: input.isPlaybackRef,
    directCursorRef: input.directCursorRef,
    emptyWindowsRef: input.emptyWindowsRef,
    pollTimerRef: input.pollTimerRef,
  };
}

export function buildMonitorProviderSessionAudioSlice(input: {
  currentSegmentRef: React.MutableRefObject<CrossfadeHandle | null>;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
}): UseMonitorProviderSessionActionsInput["audio"] {
  return {
    currentSegmentRef: input.currentSegmentRef,
    audioContextRef: input.audioContextRef,
  };
}

export function buildMonitorProviderSessionReplaySlice(input: {
  replayEventsRef: React.MutableRefObject<SessionEvent[]>;
  replayMetricsRef: React.MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: React.MutableRefObject<number>;
  replayHydratingRef: React.MutableRefObject<boolean>;
  replayHydrationTokenRef: React.MutableRefObject<number>;
  playbackPausedRef: React.MutableRefObject<boolean>;
}): UseMonitorProviderSessionActionsInput["replay"] {
  return {
    replayEventsRef: input.replayEventsRef,
    replayMetricsRef: input.replayMetricsRef,
    replayIndexRef: input.replayIndexRef,
    replayHydratingRef: input.replayHydratingRef,
    replayHydrationTokenRef: input.replayHydrationTokenRef,
    playbackPausedRef: input.playbackPausedRef,
  };
}

export function buildMonitorProviderSessionGuideTrackSlice(input: {
  guideTrackPathRef: React.MutableRefObject<string | null>;
  guideTrackQueueRef: React.MutableRefObject<string[]>;
  guideTrackRef: React.MutableRefObject<GuideTrackPCM | null>;
  guideTrackLoadPromiseRef: React.MutableRefObject<Promise<void> | null>;
}): UseMonitorProviderSessionActionsInput["guideTrack"] {
  return {
    guideTrackPathRef: input.guideTrackPathRef,
    guideTrackQueueRef: input.guideTrackQueueRef,
    guideTrackRef: input.guideTrackRef,
    guideTrackLoadPromiseRef: input.guideTrackLoadPromiseRef,
  };
}
