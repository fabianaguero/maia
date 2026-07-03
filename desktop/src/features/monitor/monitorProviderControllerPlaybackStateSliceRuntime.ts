import type { SessionEvent } from "../../api/sessions";
import type { MonitorMetrics, StreamListener } from "./monitorContextTypes";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export function buildMonitorProviderRuntimePlaybackSlice(input: {
  replayEventsRef: React.MutableRefObject<SessionEvent[]>;
  replayMetricsRef: React.MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: React.MutableRefObject<number>;
  replayHydratingRef: React.MutableRefObject<boolean>;
  replayHydrationTokenRef: React.MutableRefObject<number>;
  playbackPausedRef: React.MutableRefObject<boolean>;
  setPlaybackProgress: React.Dispatch<React.SetStateAction<number | null>>;
  setIsPlaybackPaused: React.Dispatch<React.SetStateAction<boolean>>;
  setPlaybackEventIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setPlaybackEventCount: React.Dispatch<React.SetStateAction<number | null>>;
}): UseMonitorProviderRuntimeOrchestrationInput["playback"] {
  return {
    replayEventsRef: input.replayEventsRef,
    replayMetricsRef: input.replayMetricsRef,
    replayIndexRef: input.replayIndexRef,
    replayHydratingRef: input.replayHydratingRef,
    replayHydrationTokenRef: input.replayHydrationTokenRef,
    playbackPausedRef: input.playbackPausedRef,
    setPlaybackProgress: input.setPlaybackProgress,
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    setPlaybackEventIndex: input.setPlaybackEventIndex,
    setPlaybackEventCount: input.setPlaybackEventCount,
  };
}

export function buildMonitorProviderRuntimeLiveSlice(input: {
  activeRef: React.MutableRefObject<boolean>;
  pollTimerRef: React.MutableRefObject<number | null>;
  wsRef: React.MutableRefObject<WebSocket | null>;
  wsLineBufferRef: React.MutableRefObject<string[]>;
  httpUrlRef: React.MutableRefObject<string>;
  directCursorRef: React.MutableRefObject<number | undefined>;
  emptyWindowsRef: React.MutableRefObject<number>;
  pollIndexRef: React.MutableRefObject<number>;
  isPlaybackRef: React.MutableRefObject<boolean>;
  listenersRef: React.MutableRefObject<Set<StreamListener>>;
}): UseMonitorProviderRuntimeOrchestrationInput["live"] {
  return {
    activeRef: input.activeRef,
    pollTimerRef: input.pollTimerRef,
    wsRef: input.wsRef,
    wsLineBufferRef: input.wsLineBufferRef,
    httpUrlRef: input.httpUrlRef,
    directCursorRef: input.directCursorRef,
    emptyWindowsRef: input.emptyWindowsRef,
    pollIndexRef: input.pollIndexRef,
    isPlaybackRef: input.isPlaybackRef,
    listenersRef: input.listenersRef,
  };
}
