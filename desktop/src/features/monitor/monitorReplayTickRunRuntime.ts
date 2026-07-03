import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { MonitorPlaybackRuntimeLogger } from "./monitorPlaybackSessionRuntime";
import {
  handleReplayTickEndState,
  scheduleNextReplayTick,
  shouldRunReplayTick,
} from "./monitorReplayTickLifecycleRuntime";

type SyncReplayTelemetryFn = (processedEvents: number) => void;
type SetBooleanState = (value: boolean) => void;

export function runReplayTickState(input: {
  activeRef: MutableRefObject<boolean>;
  playbackPausedRef: MutableRefObject<boolean>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  pollTimerRef: MutableRefObject<number | null>;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  intervalMs: number;
  dispatchReplayEventAtIndex: (eventIndex: number) => boolean;
  syncReplayTelemetry: SyncReplayTelemetryFn;
  setIsPlaybackPaused: SetBooleanState;
  stopAllMonitorAudio: () => void;
  logger: MonitorPlaybackRuntimeLogger;
  replayTick: () => void;
}): void {
  if (
    !shouldRunReplayTick({
      activeRef: input.activeRef,
      playbackPausedRef: input.playbackPausedRef,
    })
  ) {
    return;
  }

  const events = input.replayEventsRef.current;
  const idx = input.replayIndexRef.current;

  if (idx >= events.length) {
    handleReplayTickEndState({
      replayHydratingRef: input.replayHydratingRef,
      pollTimerRef: input.pollTimerRef,
      setTimeoutFn: input.setTimeoutFn,
      replayTick: input.replayTick,
      activeRef: input.activeRef,
      playbackPausedRef: input.playbackPausedRef,
      setIsPlaybackPaused: input.setIsPlaybackPaused,
      syncReplayTelemetry: input.syncReplayTelemetry,
      stopAllMonitorAudio: input.stopAllMonitorAudio,
      logger: input.logger,
      replayEventsRef: input.replayEventsRef,
      replayIndexRef: input.replayIndexRef,
    });
    return;
  }

  const ok = input.dispatchReplayEventAtIndex(idx);
  if (!ok) {
    input.activeRef.current = false;
    return;
  }

  scheduleNextReplayTick({
    logger: input.logger,
    replayIndexRef: input.replayIndexRef,
    replayEventsRef: input.replayEventsRef,
    pollTimerRef: input.pollTimerRef,
    setTimeoutFn: input.setTimeoutFn,
    replayTick: input.replayTick,
    intervalMs: input.intervalMs,
  });
}
