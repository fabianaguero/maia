import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { ActiveMonitorSession } from "./monitorContextTypes";
import {
  resolveReplayProgressForWindow,
  resolveReplayTargetIndex,
  resolveSteppedReplayIndex,
} from "../../utils/replay";
import { buildReplayUpdateFromEvent } from "./monitorReplayRuntime";
import type { MonitorPlaybackRuntimeLogger } from "./monitorPlaybackSessionRuntime";

type EmitUpdateFn = (
  update: LiveLogStreamUpdate,
  options?: {
    accumulateMetrics?: boolean;
    persistPlaybackEvent?: boolean;
  },
) => void;

type SyncReplayTelemetryFn = (processedEvents: number) => void;
type SyncGuideTrackToReplayProgressFn = (progress: number) => void;
type SetBooleanState = (value: boolean) => void;

export function clearReplayTimer(input: {
  pollTimerRef: MutableRefObject<number | null>;
  clearTimeoutFn: (timer: number) => void;
}): void {
  if (input.pollTimerRef.current !== null) {
    input.clearTimeoutFn(input.pollTimerRef.current);
    input.pollTimerRef.current = null;
  }
}

export function dispatchReplayEventAtIndexState(input: {
  eventIndex: number;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  emitUpdate: EmitUpdateFn;
  syncReplayTelemetry: SyncReplayTelemetryFn;
  syncGuideTrackToReplayProgress?: SyncGuideTrackToReplayProgressFn;
  syncGuideTrack?: boolean;
}): boolean {
  const events = input.replayEventsRef.current;
  if (events.length === 0) {
    return false;
  }

  const clampedIndex = Math.max(0, Math.min(input.eventIndex, events.length - 1));
  const event = events[clampedIndex]!;
  input.replayIndexRef.current = clampedIndex + 1;

  if (input.syncGuideTrack && input.syncGuideTrackToReplayProgress) {
    input.syncGuideTrackToReplayProgress(events.length > 1 ? clampedIndex / events.length : 0);
  }

  input.syncReplayTelemetry(clampedIndex + 1);
  input.emitUpdate(
    buildReplayUpdateFromEvent(
      event,
      input.sessionRef.current?.sourcePath ?? event.sessionId,
      clampedIndex + 1,
    ),
    {
      accumulateMetrics: false,
      persistPlaybackEvent: false,
    },
  );

  return true;
}

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
  if (!input.activeRef.current || input.playbackPausedRef.current) {
    return;
  }

  const events = input.replayEventsRef.current;
  const idx = input.replayIndexRef.current;

  if (idx >= events.length) {
    if (input.replayHydratingRef.current) {
      input.pollTimerRef.current = input.setTimeoutFn(input.replayTick, 200);
      return;
    }
    input.logger.info("playback reached end after %d events — stopping replay", idx);
    input.activeRef.current = false;
    input.playbackPausedRef.current = true;
    input.setIsPlaybackPaused(true);
    input.syncReplayTelemetry(events.length);
    input.stopAllMonitorAudio();
    return;
  }

  const ok = input.dispatchReplayEventAtIndex(idx);
  if (!ok) {
    input.activeRef.current = false;
    return;
  }

  input.logger.info("playback event %d/%d", idx + 1, events.length);
  input.pollTimerRef.current = input.setTimeoutFn(input.replayTick, input.intervalMs);
}

export function seekReplayPlaybackState(input: {
  progress: number;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
  pollTimerRef: MutableRefObject<number | null>;
  playbackPausedRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  dispatchReplayEventAtIndex: (
    eventIndex: number,
    options?: { syncGuideTrack?: boolean },
  ) => boolean;
  clearTimeoutFn: (timer: number) => void;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  intervalMs: number;
  replayTick: () => void;
}): void {
  clearReplayTimer({
    pollTimerRef: input.pollTimerRef,
    clearTimeoutFn: input.clearTimeoutFn,
  });

  const targetIndex = resolveReplayTargetIndex(
    input.progress,
    input.replayEventsRef.current.length,
  );
  input.activeRef.current = true;
  input.guideTrackFinishedRef.current = false;
  const ok = input.dispatchReplayEventAtIndex(targetIndex, { syncGuideTrack: true });
  if (!ok) {
    return;
  }

  if (input.activeRef.current && !input.playbackPausedRef.current) {
    input.pollTimerRef.current = input.setTimeoutFn(input.replayTick, input.intervalMs);
  }
}

export function seekReplayWindowState(input: {
  replayWindowIndex: number;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  seekPlaybackProgress: (progress: number) => void;
}): void {
  input.seekPlaybackProgress(
    resolveReplayProgressForWindow(input.replayWindowIndex, input.replayEventsRef.current.length),
  );
}

export function pauseReplayPlaybackState(input: {
  pollTimerRef: MutableRefObject<number | null>;
  playbackPausedRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  setIsPlaybackPaused: SetBooleanState;
  clearTimeoutFn: (timer: number) => void;
}): void {
  clearReplayTimer({
    pollTimerRef: input.pollTimerRef,
    clearTimeoutFn: input.clearTimeoutFn,
  });
  input.playbackPausedRef.current = true;
  input.activeRef.current = false;
  input.setIsPlaybackPaused(true);
}

export function resumeReplayPlaybackState(input: {
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
  pollTimerRef: MutableRefObject<number | null>;
  playbackPausedRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  dispatchReplayEventAtIndex: (
    eventIndex: number,
    options?: { syncGuideTrack?: boolean },
  ) => boolean;
  setIsPlaybackPaused: SetBooleanState;
  clearTimeoutFn: (timer: number) => void;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  intervalMs: number;
  replayTick: () => void;
}): void {
  clearReplayTimer({
    pollTimerRef: input.pollTimerRef,
    clearTimeoutFn: input.clearTimeoutFn,
  });

  if (input.replayIndexRef.current >= input.replayEventsRef.current.length) {
    input.guideTrackFinishedRef.current = false;
    const ok = input.dispatchReplayEventAtIndex(0, { syncGuideTrack: true });
    if (!ok) {
      input.playbackPausedRef.current = true;
      input.activeRef.current = false;
      input.setIsPlaybackPaused(true);
      return;
    }
  }

  input.playbackPausedRef.current = false;
  input.activeRef.current = true;
  input.setIsPlaybackPaused(false);
  input.pollTimerRef.current = input.setTimeoutFn(input.replayTick, input.intervalMs);
}

export function stepReplayPlaybackWindowState(input: {
  direction: -1 | 1;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
  pollTimerRef: MutableRefObject<number | null>;
  playbackPausedRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  dispatchReplayEventAtIndex: (
    eventIndex: number,
    options?: { syncGuideTrack?: boolean },
  ) => boolean;
  setIsPlaybackPaused: SetBooleanState;
  clearTimeoutFn: (timer: number) => void;
}): void {
  clearReplayTimer({
    pollTimerRef: input.pollTimerRef,
    clearTimeoutFn: input.clearTimeoutFn,
  });

  input.playbackPausedRef.current = true;
  input.activeRef.current = false;
  input.setIsPlaybackPaused(true);
  input.guideTrackFinishedRef.current = false;

  const targetIndex = resolveSteppedReplayIndex(
    input.replayIndexRef.current,
    input.replayEventsRef.current.length,
    input.direction,
  );
  void input.dispatchReplayEventAtIndex(targetIndex, { syncGuideTrack: true });
}
