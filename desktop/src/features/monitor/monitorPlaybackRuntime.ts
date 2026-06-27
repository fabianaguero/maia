import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import {
  buildReplayCumulativeMetrics,
  resolveReplayProgressForWindow,
  resolveReplayTargetIndex,
  resolveSteppedReplayIndex,
} from "../../utils/replay";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import { activatePlaybackMonitorSessionState } from "./monitorOrchestrationRuntime";
import type { GuideTrackPCM } from "./monitorContextRuntime";
import {
  buildReplayUpdateFromEvent,
  shouldHydrateReplayFromSource,
} from "./monitorReplayRuntime";
import { shouldAwaitGuideTrackForPlayback } from "./monitorStartupRuntime";

export interface MonitorPlaybackRuntimeLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
}

export interface PlaybackSessionSelection {
  sessionId: string;
  label: string;
  sourcePath: string;
  repoId?: string | null;
}

export interface PreparedPlaybackMonitorSession {
  session: ActiveMonitorSession;
  events: SessionEvent[];
  shouldHydrateReplay: boolean;
}

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
type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetMetricsState = (value: MonitorMetrics) => void;
type RebuildReplayEventsFromSourceFn = (input: {
  sessionId: string;
  sourcePath: string;
}) => Promise<SessionEvent[]>;

export async function preparePlaybackMonitorSessionState(
  input: PlaybackSessionSelection & {
    loadSessionEvents: (sessionId: string) => Promise<SessionEvent[]>;
    logger: MonitorPlaybackRuntimeLogger;
  },
): Promise<PreparedPlaybackMonitorSession | null> {
  input.logger.info(
    "playbackSession id=%s label=%s path=%s repoId=%s",
    input.sessionId,
    input.label,
    input.sourcePath,
    input.repoId,
  );

  const events = await input.loadSessionEvents(input.sessionId);
  input.logger.info("playbackSession loaded %d stored events", events.length);

  const shouldHydrateReplay = shouldHydrateReplayFromSource(
    events.length,
    input.sourcePath,
  );
  if (events.length === 0 && !shouldHydrateReplay) {
    input.logger.warn("playbackSession — 0 events, aborting");
    return null;
  }

  return {
    session: createPlaybackMonitorSession({
      sessionId: input.sessionId,
      label: input.label,
      sourcePath: input.sourcePath,
      repoId: input.repoId,
    }),
    events,
    shouldHydrateReplay,
  };
}

export function activatePreparedPlaybackMonitorSessionState(input: {
  prepared: PreparedPlaybackMonitorSession;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  playbackPausedRef: MutableRefObject<boolean>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  replayHydrationTokenRef: MutableRefObject<number>;
  setSession: SetSessionState;
  setIsPlayback: SetBooleanState;
  setIsPlaybackPaused: SetBooleanState;
  setMetrics: SetMetricsState;
  syncReplayTelemetry: SyncReplayTelemetryFn;
}): number {
  return activatePlaybackMonitorSessionState({
    session: input.prepared.session,
    events: input.prepared.events,
    cumulativeMetrics: buildReplayCumulativeMetrics(input.prepared.events),
    shouldHydrateReplay: input.prepared.shouldHydrateReplay,
    sessionRef: input.sessionRef,
    activeRef: input.activeRef,
    isPlaybackRef: input.isPlaybackRef,
    playbackPausedRef: input.playbackPausedRef,
    replayEventsRef: input.replayEventsRef,
    replayMetricsRef: input.replayMetricsRef,
    replayIndexRef: input.replayIndexRef,
    replayHydratingRef: input.replayHydratingRef,
    replayHydrationTokenRef: input.replayHydrationTokenRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    setMetrics: input.setMetrics,
    syncReplayTelemetry: input.syncReplayTelemetry,
  });
}

export async function finalizePlaybackMonitorSessionSetupState(input: {
  ensureAudioContext: () => Promise<unknown>;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackLoadPromiseRef: MutableRefObject<Promise<void> | null>;
  awaitGuideTrack: () => Promise<void>;
  replayTick: () => void;
  logger: MonitorPlaybackRuntimeLogger;
}): Promise<void> {
  await input.ensureAudioContext();

  if (
    shouldAwaitGuideTrackForPlayback({
      guideTrackPathRef: input.guideTrackPathRef,
      guideTrackQueueRef: input.guideTrackQueueRef,
      guideTrackRef: input.guideTrackRef,
      guideTrackLoadPromiseRef: input.guideTrackLoadPromiseRef,
    })
  ) {
    input.logger.info("playbackSession waiting for guide track decode before replay");
    await input.awaitGuideTrack();
  }

  input.replayTick();
}

export function maybeHydratePlaybackReplayState(input: {
  prepared: PreparedPlaybackMonitorSession;
  hydrationToken: number;
  replayHydrationTokenRef: MutableRefObject<number>;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  playbackPausedRef: MutableRefObject<boolean>;
  pollTimerRef: MutableRefObject<number | null>;
  syncReplayTelemetry: SyncReplayTelemetryFn;
  rebuildReplayEventsFromSource: RebuildReplayEventsFromSourceFn;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  replayTick: () => void;
  logger: MonitorPlaybackRuntimeLogger;
}): void {
  if (!input.prepared.shouldHydrateReplay) {
    return;
  }

  void hydrateReplayFromSourceState({
    sessionId: input.prepared.session.persistedSessionId ?? input.prepared.session.sessionId,
    sourcePath: input.prepared.session.sourcePath,
    hydrationToken: input.hydrationToken,
    replayHydrationTokenRef: input.replayHydrationTokenRef,
    sessionRef: input.sessionRef,
    replayEventsRef: input.replayEventsRef,
    replayMetricsRef: input.replayMetricsRef,
    replayIndexRef: input.replayIndexRef,
    replayHydratingRef: input.replayHydratingRef,
    activeRef: input.activeRef,
    playbackPausedRef: input.playbackPausedRef,
    pollTimerRef: input.pollTimerRef,
    syncReplayTelemetry: input.syncReplayTelemetry,
    rebuildReplayEventsFromSource: input.rebuildReplayEventsFromSource,
    setTimeoutFn: input.setTimeoutFn,
    replayTick: input.replayTick,
    logger: input.logger,
  });
}

export function clearReplayTimer(input: {
  pollTimerRef: MutableRefObject<number | null>;
  clearTimeoutFn: (timer: number) => void;
}): void {
  if (input.pollTimerRef.current !== null) {
    input.clearTimeoutFn(input.pollTimerRef.current);
    input.pollTimerRef.current = null;
  }
}

export function createPlaybackMonitorSession(input: {
  sessionId: string;
  label: string;
  sourcePath: string;
  repoId?: string | null;
  startedAt?: number;
}): ActiveMonitorSession {
  return {
    sessionId: `playback_${input.sessionId}`,
    persistedSessionId: input.sessionId,
    repoId: input.repoId ?? input.sessionId,
    repoTitle: input.label,
    sourcePath: input.sourcePath,
    adapterKind: "file",
    pollMode: "direct",
    startedAt: input.startedAt ?? Date.now(),
  };
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
    resolveReplayProgressForWindow(
      input.replayWindowIndex,
      input.replayEventsRef.current.length,
    ),
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

export async function hydrateReplayFromSourceState(input: {
  sessionId: string;
  sourcePath: string;
  hydrationToken: number;
  replayHydrationTokenRef: MutableRefObject<number>;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<
    { windowCount: number; processedLines: number; totalAnomalies: number }[]
  >;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  activeRef: MutableRefObject<boolean>;
  playbackPausedRef: MutableRefObject<boolean>;
  pollTimerRef: MutableRefObject<number | null>;
  syncReplayTelemetry: SyncReplayTelemetryFn;
  rebuildReplayEventsFromSource: RebuildReplayEventsFromSourceFn;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  replayTick: () => void;
  logger: MonitorPlaybackRuntimeLogger;
}): Promise<void> {
  try {
    const rebuiltEvents = await input.rebuildReplayEventsFromSource({
      sessionId: input.sessionId,
      sourcePath: input.sourcePath,
    });
    if (
      input.replayHydrationTokenRef.current !== input.hydrationToken ||
      input.sessionRef.current?.persistedSessionId !== input.sessionId
    ) {
      return;
    }

    if (rebuiltEvents.length > input.replayEventsRef.current.length) {
      input.replayEventsRef.current = rebuiltEvents;
      input.replayMetricsRef.current = buildReplayCumulativeMetrics(rebuiltEvents);
      input.syncReplayTelemetry(
        Math.min(input.replayIndexRef.current, rebuiltEvents.length),
      );
      input.logger.info(
        "playbackSession rebuilt replay windows from source → %d events",
        rebuiltEvents.length,
      );
    }
  } catch (error) {
    if (input.replayHydrationTokenRef.current !== input.hydrationToken) {
      return;
    }
    input.logger.warn(
      "playbackSession replay rebuild failed: %s",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    if (input.replayHydrationTokenRef.current === input.hydrationToken) {
      input.replayHydratingRef.current = false;
      if (
        input.activeRef.current &&
        !input.playbackPausedRef.current &&
        input.pollTimerRef.current === null
      ) {
        input.pollTimerRef.current = input.setTimeoutFn(input.replayTick, 0);
      }
    }
  }
}
