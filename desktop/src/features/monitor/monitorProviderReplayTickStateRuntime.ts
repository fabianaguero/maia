import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { MonitorProviderRuntimeLogger } from "./monitorProviderOrchestrationRuntime";

type SetBooleanState = Dispatch<SetStateAction<boolean>>;

export function buildRunReplayTickStateInput(input: {
  activeRef: MutableRefObject<boolean>;
  playbackPausedRef: MutableRefObject<boolean>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  pollTimerRef: MutableRefObject<number | null>;
  intervalMs: number;
  dispatchReplayEventAtIndex: (eventIndex: number) => boolean;
  syncReplayTelemetry: (processedEvents: number) => void;
  setIsPlaybackPaused: SetBooleanState;
  stopAllMonitorAudio: () => void;
  logger: MonitorProviderRuntimeLogger;
  replayTick: () => void;
}) {
  return {
    activeRef: input.activeRef,
    playbackPausedRef: input.playbackPausedRef,
    replayEventsRef: input.replayEventsRef,
    replayIndexRef: input.replayIndexRef,
    replayHydratingRef: input.replayHydratingRef,
    pollTimerRef: input.pollTimerRef,
    setTimeoutFn: window.setTimeout,
    intervalMs: input.intervalMs,
    dispatchReplayEventAtIndex: input.dispatchReplayEventAtIndex,
    syncReplayTelemetry: input.syncReplayTelemetry,
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    stopAllMonitorAudio: input.stopAllMonitorAudio,
    logger: input.logger,
    replayTick: input.replayTick,
  };
}
