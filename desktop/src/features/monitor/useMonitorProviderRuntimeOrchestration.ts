import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import type { SessionEvent } from "../../api/sessions";
import {
  emitMonitorAudioProbe,
  ensureMonitorAudioContext,
  stopAllMonitorAudio,
  type GuideTrackPCM,
} from "./monitorContextRuntime";
import type { ActiveMonitorSession, MonitorMetrics, StreamListener } from "./monitorContextTypes";
import {
  resetReplayTelemetryState,
  syncGuideTrackCursorToReplayProgress,
  syncReplayTelemetryState,
} from "./monitorReplayRuntime";
import {
  POLL_INTERVAL_MS,
  scheduleMonitorPoll,
  stopMonitorPollingState,
} from "./monitorSessionRuntime";
import { dispatchReplayEventAtIndexState, runReplayTickState } from "./monitorPlaybackRuntime";
import { resumeMonitorAudioContextState } from "./monitorLiveLifecycleRuntime";
import {
  buildDispatchReplayEventAtIndexStateInput,
  buildEmitMonitorProviderUpdateStateInput,
  buildResumeMonitorAudioContextStateInput,
  buildRunMonitorProviderPollStateInput,
  buildRunReplayTickStateInput,
  buildSyncGuideTrackCursorStateInput,
  buildSyncReplayTelemetryStateInput,
  type MonitorProviderRuntimeLogger,
} from "./monitorProviderOrchestrationRuntime";
import { buildMonitorProviderLiveStartBaseInput } from "./monitorProviderStartRuntime";
import {
  emitMonitorProviderUpdateState,
  runMonitorProviderPollState,
} from "./monitorProviderLiveRuntime";
import type { SourceTemplate } from "../../config/sourceTemplates";
import type { LiveLogStreamUpdate } from "../../types/library";
import type { StreamSessionPollResult } from "../../types/monitor";

type PollStreamSessionFn = (sessionId: string) => Promise<StreamSessionPollResult>;
type PollLogStreamFn = (
  sourcePath: string,
  cursor?: number,
  maxBytes?: number,
) => Promise<LiveLogStreamUpdate>;
type IngestStreamChunkFn = (sessionId: string, chunk: string) => Promise<StreamSessionPollResult>;

interface UseMonitorProviderRuntimeOrchestrationInput {
  logger: MonitorProviderRuntimeLogger;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  setSession: Dispatch<SetStateAction<ActiveMonitorSession | null>>;
  setIsPlayback: Dispatch<SetStateAction<boolean>>;
  setMetrics: Dispatch<SetStateAction<MonitorMetrics>>;
  setAudioContext: Dispatch<SetStateAction<AudioContext | null>>;
  setPlaybackProgress: Dispatch<SetStateAction<number | null>>;
  setIsPlaybackPaused: Dispatch<SetStateAction<boolean>>;
  setPlaybackEventIndex: Dispatch<SetStateAction<number | null>>;
  setPlaybackEventCount: Dispatch<SetStateAction<number | null>>;
  updatePersistedSessionCursor: (
    sessionId: string,
    toOffset: number,
    lineCount: number,
    anomalyCount: number,
    suggestedBpm: number | null,
  ) => Promise<void>;
  insertSessionEvent: (payload: {
    sessionId: string;
    pollIndex: number;
    fromOffset: number;
    toOffset: number;
    summary: string;
    suggestedBpm: number | null;
    confidence: number;
    dominantLevel: string;
    lineCount: number;
    anomalyCount: number;
    levelCountsJson: string;
    anomalyMarkersJson: string;
    topComponentsJson: string;
    sonificationCuesJson: string;
    parsedLinesJson: string;
    warningsJson: string;
  }) => Promise<unknown>;
  pollStreamSession: PollStreamSessionFn;
  pollLogStream: PollLogStreamFn;
  ingestStreamChunk: IngestStreamChunkFn;
  fetchText: (url: string) => Promise<string>;
  updatePersistedSessionStatus: (
    persistedSessionId: string,
    status: "active" | "paused" | "stopped",
  ) => Promise<void>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  activeRef: MutableRefObject<boolean>;
  pollTimerRef: MutableRefObject<number | null>;
  wsRef: MutableRefObject<WebSocket | null>;
  wsLineBufferRef: MutableRefObject<string[]>;
  httpUrlRef: MutableRefObject<string>;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  pollIndexRef: MutableRefObject<number>;
  isPlaybackRef: MutableRefObject<boolean>;
  listenersRef: MutableRefObject<Set<StreamListener>>;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  replayIndexRef: MutableRefObject<number>;
  replayHydratingRef: MutableRefObject<boolean>;
  replayHydrationTokenRef: MutableRefObject<number>;
  playbackPausedRef: MutableRefObject<boolean>;
  guideTrackRef: MutableRefObject<GuideTrackPCM | null>;
  guideTrackCursorRef: MutableRefObject<{ current: number }>;
  guideTrackFinishedRef: MutableRefObject<boolean>;
  activeTemplateRef: MutableRefObject<SourceTemplate>;
  setActiveTemplateState: Dispatch<SetStateAction<SourceTemplate>>;
  buildReloadPendingGuideTrack: (reason: "session-start" | "attach-session") => () => void;
}

export function useMonitorProviderRuntimeOrchestration(
  input: UseMonitorProviderRuntimeOrchestrationInput,
) {
  const stopPolling = useCallback(() => {
    stopMonitorPollingState({
      activeRef: input.activeRef,
      pollTimerRef: input.pollTimerRef,
      wsRef: input.wsRef,
      wsLineBufferRef: input.wsLineBufferRef,
      httpUrlRef: input.httpUrlRef,
      clearTimeoutFn: window.clearTimeout,
    });
  }, [input]);

  const schedulePoll = useCallback(
    (doPoll: () => Promise<void>) => {
      scheduleMonitorPoll({
        activeRef: input.activeRef,
        pollTimerRef: input.pollTimerRef,
        intervalMs: POLL_INTERVAL_MS,
        setTimeoutFn: window.setTimeout,
        doPoll,
      });
    },
    [input.activeRef, input.pollTimerRef],
  );

  const resetReplayTelemetry = useCallback(() => {
    resetReplayTelemetryState({
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
    });
  }, [input]);

  const syncReplayTelemetry = useCallback(
    (processedEvents: number) => {
      syncReplayTelemetryState(
        buildSyncReplayTelemetryStateInput({
          processedEvents,
          replayEventsRef: input.replayEventsRef,
          replayMetricsRef: input.replayMetricsRef,
          setPlaybackEventCount: input.setPlaybackEventCount,
          setPlaybackEventIndex: input.setPlaybackEventIndex,
          setPlaybackProgress: input.setPlaybackProgress,
          setMetrics: input.setMetrics,
        }),
      );
    },
    [input],
  );

  const syncGuideTrackToReplayProgress = useCallback(
    (progress: number) => {
      syncGuideTrackCursorToReplayProgress(
        buildSyncGuideTrackCursorStateInput({
          pcm: input.guideTrackRef.current,
          cursorRef: input.guideTrackCursorRef,
          finishedRef: input.guideTrackFinishedRef,
          progress,
        }),
      );
    },
    [input.guideTrackCursorRef, input.guideTrackFinishedRef, input.guideTrackRef],
  );

  const emitUpdate = useCallback(
    (
      update: LiveLogStreamUpdate,
      options?: {
        accumulateMetrics?: boolean;
        persistPlaybackEvent?: boolean;
      },
    ) => {
      emitMonitorProviderUpdateState(
        buildEmitMonitorProviderUpdateStateInput({
          update,
          listenersRef: input.listenersRef,
          sessionRef: input.sessionRef,
          pollIndexRef: input.pollIndexRef,
          audioContextRef: input.audioContextRef,
          setMetrics: input.setMetrics,
          updatePersistedSessionCursor: input.updatePersistedSessionCursor,
          insertSessionEvent: input.insertSessionEvent,
          logger: input.logger,
          options,
        }),
      );
    },
    [input],
  );

  const doPoll = useCallback(async () => {
    await runMonitorProviderPollState(
      buildRunMonitorProviderPollStateInput({
        sessionRef: input.sessionRef,
        activeRef: input.activeRef,
        directCursorRef: input.directCursorRef,
        emptyWindowsRef: input.emptyWindowsRef,
        wsLineBufferRef: input.wsLineBufferRef,
        httpUrlRef: input.httpUrlRef,
        pollStreamSession: input.pollStreamSession,
        pollLogStream: input.pollLogStream,
        ingestStreamChunk: input.ingestStreamChunk,
        fetchText: input.fetchText,
        emitUpdate,
        schedulePoll,
        doPoll,
        logger: input.logger,
      }),
    );
  }, [emitUpdate, input, schedulePoll]);

  const ensureProviderAudioContext = useCallback(
    () =>
      ensureMonitorAudioContext({
        audioContextRef: input.audioContextRef,
        setAudioContext: input.setAudioContext,
      }),
    [input.audioContextRef, input.setAudioContext],
  );

  const emitLiveStartProbe = useCallback((context: AudioContext) => {
    emitMonitorAudioProbe({
      context,
      frequency: 528,
      attackGain: 0.12,
      releaseTimeSec: 0.25,
    });
  }, []);

  const runProviderPoll = useCallback(() => {
    void doPoll();
  }, [doPoll]);

  const buildLiveStartInput = useCallback(
    (reason: "session-start" | "attach-session", includeProbe: boolean) =>
      buildMonitorProviderLiveStartBaseInput({
        directCursorRef: input.directCursorRef,
        emptyWindowsRef: input.emptyWindowsRef,
        pollIndexRef: input.pollIndexRef,
        activeTemplateRef: input.activeTemplateRef,
        setActiveTemplateState: input.setActiveTemplateState,
        updatePersistedSessionStatus: input.updatePersistedSessionStatus,
        sessionRef: input.sessionRef,
        activeRef: input.activeRef,
        isPlaybackRef: input.isPlaybackRef,
        setSession: input.setSession,
        setIsPlayback: input.setIsPlayback,
        setMetrics: input.setMetrics,
        resetReplayTelemetry,
        ensureAudioContext: ensureProviderAudioContext,
        emitProbe: includeProbe ? emitLiveStartProbe : undefined,
        reloadPendingGuideTrack: input.buildReloadPendingGuideTrack(reason),
        doPoll: runProviderPoll,
      }),
    [emitLiveStartProbe, ensureProviderAudioContext, input, resetReplayTelemetry, runProviderPoll],
  );

  const dispatchReplayEventAtIndex = useCallback(
    (eventIndex: number, options?: { syncGuideTrack?: boolean }) =>
      dispatchReplayEventAtIndexState(
        buildDispatchReplayEventAtIndexStateInput({
          eventIndex,
          replayEventsRef: input.replayEventsRef,
          replayIndexRef: input.replayIndexRef,
          sessionRef: input.sessionRef,
          emitUpdate,
          syncReplayTelemetry,
          syncGuideTrackToReplayProgress,
          syncGuideTrack: options?.syncGuideTrack,
        }),
      ),
    [
      emitUpdate,
      input.replayEventsRef,
      input.replayIndexRef,
      input.sessionRef,
      syncGuideTrackToReplayProgress,
      syncReplayTelemetry,
    ],
  );

  const replayTick = useCallback(() => {
    runReplayTickState(
      buildRunReplayTickStateInput({
        activeRef: input.activeRef,
        playbackPausedRef: input.playbackPausedRef,
        replayEventsRef: input.replayEventsRef,
        replayIndexRef: input.replayIndexRef,
        replayHydratingRef: input.replayHydratingRef,
        pollTimerRef: input.pollTimerRef,
        intervalMs: POLL_INTERVAL_MS,
        dispatchReplayEventAtIndex: (eventIndex) => dispatchReplayEventAtIndex(eventIndex),
        syncReplayTelemetry,
        setIsPlaybackPaused: input.setIsPlaybackPaused,
        stopAllMonitorAudio,
        logger: input.logger,
        replayTick,
      }),
    );
  }, [dispatchReplayEventAtIndex, input, syncReplayTelemetry]);

  const resumeAudio = useCallback(async () => {
    const resumeState = buildResumeMonitorAudioContextStateInput({
      audioContextRef: input.audioContextRef,
      setAudioContext: input.setAudioContext,
      logger: input.logger,
    });
    await resumeMonitorAudioContextState({
      ensureAudioContext: () => ensureMonitorAudioContext(resumeState.ensureAudioContext()),
      emitProbe: (context) => emitMonitorAudioProbe(resumeState.emitProbe(context)),
      logger: resumeState.logger,
    });
  }, [input]);

  return {
    stopPolling,
    resetReplayTelemetry,
    syncReplayTelemetry,
    emitUpdate,
    doPoll,
    ensureProviderAudioContext,
    buildLiveStartInput,
    dispatchReplayEventAtIndex,
    replayTick,
    resumeAudio,
  };
}
