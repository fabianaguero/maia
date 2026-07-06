import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { MonitorPlaybackRuntimeLogger } from "./monitorPlaybackSessionRuntime";

type SyncReplayTelemetryFn = (processedEvents: number) => void;
type SetBooleanState = (value: boolean) => void;

export function shouldRunReplayTick(input: {
  activeRef: MutableRefObject<boolean>;
  playbackPausedRef: MutableRefObject<boolean>;
}): boolean {
  return input.activeRef.current && !input.playbackPausedRef.current;
}

export function handleReplayTickEndState(input: {
  replayHydratingRef: MutableRefObject<boolean>;
  pollTimerRef: MutableRefObject<number | null>;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  replayTick: () => void;
  activeRef: MutableRefObject<boolean>;
  playbackPausedRef: MutableRefObject<boolean>;
  setIsPlaybackPaused: SetBooleanState;
  syncReplayTelemetry: SyncReplayTelemetryFn;
  stopAllMonitorAudio: () => void;
  logger: MonitorPlaybackRuntimeLogger;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
}): boolean {
  if (input.replayHydratingRef.current) {
    input.pollTimerRef.current = input.setTimeoutFn(input.replayTick, 200);
    return true;
  }

  input.logger.info(
    "playback reached end after %d events — stopping replay",
    input.replayIndexRef.current,
  );
  input.activeRef.current = false;
  input.playbackPausedRef.current = true;
  input.setIsPlaybackPaused(true);
  input.syncReplayTelemetry(input.replayEventsRef.current.length);
  input.stopAllMonitorAudio();
  return true;
}

export function scheduleNextReplayTick(input: {
  logger: MonitorPlaybackRuntimeLogger;
  replayIndexRef: MutableRefObject<number>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  pollTimerRef: MutableRefObject<number | null>;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  replayTick: () => void;
  intervalMs: number;
}): void {
  input.logger.info(
    "playback event %d/%d",
    input.replayIndexRef.current + 1,
    input.replayEventsRef.current.length,
  );
  input.pollTimerRef.current = input.setTimeoutFn(input.replayTick, input.intervalMs);
}
