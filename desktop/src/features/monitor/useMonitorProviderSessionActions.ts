import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate, RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput, StreamSessionRecord } from "../../types/monitor";
import type { ActiveMonitorSession, MonitorMetrics } from "./monitorContextTypes";
import { rebuildReplayEventsFromSource } from "./monitorReplayRuntime";
import {
  stopAllMonitorAudio,
  type CrossfadeHandle,
  type GuideTrackPCM,
} from "./monitorContextRuntime";
import {
  resolveLiveMonitorPollMode,
  startLiveMonitorSessionState,
  stopLiveMonitorSessionState,
} from "./monitorLiveLifecycleRuntime";
import {
  attachMonitorProviderSessionState,
  startMonitorProviderSessionState,
} from "./monitorProviderSessionRuntime";
import { startMonitorProviderPlaybackSessionState } from "./monitorProviderPlaybackSessionRuntime";
import {
  replaceExistingMonitorSessionIfPresent,
  type MonitorProviderLiveStartBaseInput,
} from "./monitorProviderStartRuntime";

type BuildLiveStartInputFn = (
  reason: "session-start" | "attach-session",
  includeProbe: boolean,
) => MonitorProviderLiveStartBaseInput;
type StartStreamSessionFn = (input: StartSessionInput) => Promise<unknown>;
type StopStreamSessionFn = (sessionId: string) => Promise<unknown>;
type ListSessionEventsFn = (sessionId: string) => Promise<SessionEvent[]>;
type PollLogStreamFn = (
  sourcePath: string,
  cursor?: number,
  maxBytes?: number,
) => Promise<LiveLogStreamUpdate>;

export interface MonitorProviderSessionActionsLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  trace: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

interface UseMonitorProviderSessionActionsInput {
  logger: MonitorProviderSessionActionsLogger;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  setSession: Dispatch<SetStateAction<ActiveMonitorSession | null>>;
  setIsPlayback: Dispatch<SetStateAction<boolean>>;
  setIsPlaybackPaused: Dispatch<SetStateAction<boolean>>;
  setMetrics: Dispatch<SetStateAction<MonitorMetrics>>;
  isPlayback: boolean;
  activeRef: MutableRefObject<boolean>;
  isPlaybackRef: MutableRefObject<boolean>;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  currentSegmentRef: MutableRefObject<CrossfadeHandle | null>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  replayHydrationTokenRef: MutableRefObject<number>;
  playbackPausedRef: MutableRefObject<boolean>;
  pollTimerRef: MutableRefObject<number | null>;
  guideTrackPathRef: MutableRefObject<string | null>;
  guideTrackQueueRef: MutableRefObject<string[]>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackLoadPromiseRef: MutableRefObject<Promise<void> | null>;
  stopPolling: () => void;
  buildLiveStartInput: BuildLiveStartInputFn;
  ensureProviderAudioContext: () => Promise<AudioContext>;
  replayTick: () => void;
  syncReplayTelemetry: (processedEvents: number) => void;
  resetReplayTelemetry: () => void;
  startStreamSession: StartStreamSessionFn;
  stopStreamSession: StopStreamSessionFn;
  listSessionEvents: ListSessionEventsFn;
  updatePersistedSessionStatus: (
    persistedSessionId: string,
    status: "active" | "paused" | "stopped",
  ) => Promise<void>;
  pollLogStream: PollLogStreamFn;
}

export function useMonitorProviderSessionActions(input: UseMonitorProviderSessionActionsInput) {
  const replaceExistingSessionIfPresent = useCallback(async () => {
    await replaceExistingMonitorSessionIfPresent({
      sessionRef: input.sessionRef,
      setSession: input.setSession,
      stopPolling: input.stopPolling,
      stopStreamSession: input.stopStreamSession,
    });
  }, [input]);

  const startSession = useCallback(
    async (
      repo: RepositoryAnalysis,
      sessionInput: StartSessionInput,
      persistedSessionId?: string,
    ): Promise<boolean> =>
      startMonitorProviderSessionState({
        repo,
        sessionInput,
        persistedSessionId,
        sessionRef: input.sessionRef,
        replaceExistingSessionIfPresent,
        resolveLiveMonitorPollMode: async ({ sessionInput: nextInput }) =>
          resolveLiveMonitorPollMode({
            sessionInput: nextInput,
            startStreamSession: input.startStreamSession,
          }),
        startLiveMonitorSession: startLiveMonitorSessionState,
        liveStartInput: input.buildLiveStartInput("session-start", true),
        logger: input.logger,
      }),
    [input, replaceExistingSessionIfPresent],
  );

  const attachSession = useCallback(
    async ({
      session: sessionRecord,
      repoId,
      repoTitle,
      trackId,
      trackTitle,
      sourceTemplateId,
      persistedSessionId,
    }: {
      session: StreamSessionRecord;
      repoId: string;
      repoTitle: string;
      trackId?: string;
      trackTitle?: string;
      sourceTemplateId?: string | null;
      persistedSessionId?: string | null;
    }): Promise<boolean> =>
      attachMonitorProviderSessionState({
        sessionRecord,
        repoId,
        repoTitle,
        trackId,
        trackTitle,
        sourceTemplateId: sourceTemplateId ?? null,
        persistedSessionId,
        sessionRef: input.sessionRef,
        replaceExistingSessionIfPresent,
        startLiveMonitorSession: startLiveMonitorSessionState,
        liveStartInput: input.buildLiveStartInput("attach-session", false),
        logger: input.logger,
      }),
    [input, replaceExistingSessionIfPresent],
  );

  const playbackSession = useCallback(
    async ({
      sessionId,
      label,
      sourcePath,
      repoId,
    }: {
      sessionId: string;
      label: string;
      sourcePath: string;
      repoId?: string | null;
    }): Promise<boolean> =>
      startMonitorProviderPlaybackSessionState({
        sessionId,
        label,
        sourcePath,
        repoId,
        sessionRef: input.sessionRef,
        stopPolling: input.stopPolling,
        loadSessionEvents: input.listSessionEvents,
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
        ensureAudioContext: input.ensureProviderAudioContext,
        guideTrackPathRef: input.guideTrackPathRef,
        guideTrackQueueRef: input.guideTrackQueueRef,
        guideTrackRef: input.guideTrackRef,
        guideTrackLoadPromiseRef: input.guideTrackLoadPromiseRef,
        awaitGuideTrack: async () =>
          input.guideTrackLoadPromiseRef.current
            ? input.guideTrackLoadPromiseRef.current
            : undefined,
        replayTick: input.replayTick,
        rebuildReplayEventsFromSource: ({ sessionId: targetSessionId, sourcePath: targetPath }) =>
          rebuildReplayEventsFromSource({
            sessionId: targetSessionId,
            sourcePath: targetPath,
            pollLogStream: input.pollLogStream,
          }),
        setTimeoutFn: window.setTimeout,
        logger: input.logger,
      }),
    [input],
  );

  const stopSession = useCallback(async (): Promise<void> => {
    const current = input.sessionRef.current;
    const wasPlayback = input.isPlayback;
    input.logger.info("stopSession id=%s wasPlayback=%s", current?.sessionId, wasPlayback);

    await stopLiveMonitorSessionState({
      session: current,
      wasPlayback,
      stopAllMonitorAudio,
      currentSegmentRef: input.currentSegmentRef,
      audioContextRef: input.audioContextRef,
      stopPolling: input.stopPolling,
      sessionRef: input.sessionRef,
      directCursorRef: input.directCursorRef,
      emptyWindowsRef: input.emptyWindowsRef,
      activeRef: input.activeRef,
      isPlaybackRef: input.isPlaybackRef,
      setSession: input.setSession,
      setIsPlayback: input.setIsPlayback,
      setMetrics: input.setMetrics,
      resetReplayTelemetry: input.resetReplayTelemetry,
      updatePersistedSessionStatus: input.updatePersistedSessionStatus,
      stopStreamSession: input.stopStreamSession,
    });
  }, [input]);

  return {
    replaceExistingSessionIfPresent,
    startSession,
    attachSession,
    playbackSession,
    stopSession,
  };
}
