import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import type { GuideTrackPCM } from "./monitorContextRuntime";
import { activatePlaybackMonitorSessionState } from "./monitorOrchestrationRuntime";
import { shouldHydrateReplayFromSource } from "./monitorReplayRuntime";
import { shouldAwaitGuideTrackForPlayback } from "./monitorStartupRuntime";
import { buildReplayCumulativeMetrics } from "../../utils/replay";

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

type SyncReplayTelemetryFn = (processedEvents: number) => void;
type SetBooleanState = (value: boolean) => void;
type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetMetricsState = (value: MonitorMetrics) => void;

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
