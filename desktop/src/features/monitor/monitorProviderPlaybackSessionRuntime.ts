import type { MutableRefObject } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { GuideTrackPCM } from "./monitorContextRuntime";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import type {
  MonitorPlaybackRuntimeLogger,
  PlaybackSessionSelection,
  PreparedPlaybackMonitorSession,
} from "./monitorPlaybackRuntime";
import {
  activatePreparedPlaybackMonitorSessionState,
  finalizePlaybackMonitorSessionSetupState,
  maybeHydratePlaybackReplayState,
  preparePlaybackMonitorSessionState,
} from "./monitorPlaybackRuntime";

type SetBooleanState = (value: boolean) => void;
type SetSessionState = (value: ActiveMonitorSession | null) => void;
type SetMetricsState = (value: MonitorMetrics) => void;
type SyncReplayTelemetryFn = (processedEvents: number) => void;
type RebuildReplayEventsFromSourceFn = (input: {
  sessionId: string;
  sourcePath: string;
}) => Promise<SessionEvent[]>;

export async function startMonitorProviderPlaybackSessionState(input: PlaybackSessionSelection & {
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  stopPolling: () => void;
  loadSessionEvents: (sessionId: string) => Promise<SessionEvent[]>;
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  playbackPausedRef: MutableRefObject<boolean>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  replayHydrationTokenRef: MutableRefObject<number>;
  pollTimerRef: MutableRefObject<number | null>;
  setSession: SetSessionState;
  setIsPlayback: SetBooleanState;
  setIsPlaybackPaused: SetBooleanState;
  setMetrics: SetMetricsState;
  syncReplayTelemetry: SyncReplayTelemetryFn;
  ensureAudioContext: () => Promise<unknown>;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackLoadPromiseRef: MutableRefObject<Promise<void> | null>;
  awaitGuideTrack: () => Promise<void>;
  replayTick: () => void;
  rebuildReplayEventsFromSource: RebuildReplayEventsFromSourceFn;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  logger: MonitorPlaybackRuntimeLogger;
}): Promise<boolean> {
  if (input.sessionRef.current) {
    input.stopPolling();
    input.sessionRef.current = null;
  }

  const prepared = await preparePlaybackMonitorSessionState({
    sessionId: input.sessionId,
    label: input.label,
    sourcePath: input.sourcePath,
    repoId: input.repoId,
    loadSessionEvents: input.loadSessionEvents,
    logger: input.logger,
  });
  if (!prepared) {
    return false;
  }

  await activateAndBootstrapPlaybackSessionState({
    prepared,
    sessionRef: input.sessionRef,
    activeRef: input.activeRef,
    isPlaybackRef: input.isPlaybackRef,
    playbackPausedRef: input.playbackPausedRef,
    replayEventsRef: input.replayEventsRef,
    replayMetricsRef: input.replayMetricsRef,
    replayIndexRef: input.replayIndexRef,
    replayHydratingRef: input.replayHydratingRef,
    replayHydrationTokenRef: input.replayHydrationTokenRef,
    pollTimerRef: input.pollTimerRef,
    setSession: input.setSession,
    setIsPlayback: input.setIsPlayback,
    setIsPlaybackPaused: input.setIsPlaybackPaused,
    setMetrics: input.setMetrics,
    syncReplayTelemetry: input.syncReplayTelemetry,
    ensureAudioContext: input.ensureAudioContext,
    guideTrackPathRef: input.guideTrackPathRef,
    guideTrackQueueRef: input.guideTrackQueueRef,
    guideTrackRef: input.guideTrackRef,
    guideTrackLoadPromiseRef: input.guideTrackLoadPromiseRef,
    awaitGuideTrack: input.awaitGuideTrack,
    replayTick: input.replayTick,
    rebuildReplayEventsFromSource: input.rebuildReplayEventsFromSource,
    setTimeoutFn: input.setTimeoutFn,
    logger: input.logger,
  });

  return true;
}

export async function activateAndBootstrapPlaybackSessionState(input: {
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
  pollTimerRef: MutableRefObject<number | null>;
  setSession: SetSessionState;
  setIsPlayback: SetBooleanState;
  setIsPlaybackPaused: SetBooleanState;
  setMetrics: SetMetricsState;
  syncReplayTelemetry: SyncReplayTelemetryFn;
  ensureAudioContext: () => Promise<unknown>;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackLoadPromiseRef: MutableRefObject<Promise<void> | null>;
  awaitGuideTrack: () => Promise<void>;
  replayTick: () => void;
  rebuildReplayEventsFromSource: RebuildReplayEventsFromSourceFn;
  setTimeoutFn: (handler: () => void, timeout: number) => number;
  logger: MonitorPlaybackRuntimeLogger;
}): Promise<number> {
  const hydrationToken = activatePreparedPlaybackMonitorSessionState({
    prepared: input.prepared,
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

  await finalizePlaybackMonitorSessionSetupState({
    ensureAudioContext: input.ensureAudioContext,
    guideTrackPathRef: input.guideTrackPathRef,
    guideTrackQueueRef: input.guideTrackQueueRef,
    guideTrackRef: input.guideTrackRef,
    guideTrackLoadPromiseRef: input.guideTrackLoadPromiseRef,
    awaitGuideTrack: input.awaitGuideTrack,
    replayTick: input.replayTick,
    logger: input.logger,
  });

  maybeHydratePlaybackReplayState({
    prepared: input.prepared,
    hydrationToken,
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

  return hydrationToken;
}
