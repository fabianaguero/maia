import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { InsertSessionEventInput } from "../../api/sessions";
import type { SessionEvent } from "../../api/sessions";
import type { LiveLogStreamUpdate, StreamSessionPollResult } from "../../types/monitor";
import type { GuideTrackPCM } from "./monitorContextRuntime";
import type { ActiveMonitorSession, MonitorMetrics, StreamListener } from "./monitorContextTypes";
import type { PersistedMonitorCursorUpdate } from "./monitorUpdateRuntime";

type SetMetricsState = Dispatch<SetStateAction<MonitorMetrics>>;
type SetNullableNumberState = Dispatch<SetStateAction<number | null>>;
type SetBooleanState = Dispatch<SetStateAction<boolean>>;

export interface MonitorProviderRuntimeLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  trace: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export function buildEmitMonitorProviderUpdateStateInput(input: {
  update: LiveLogStreamUpdate;
  listenersRef: MutableRefObject<Set<StreamListener>>;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  pollIndexRef: MutableRefObject<number>;
  audioContextRef: MutableRefObject<AudioContext | null>;
  setMetrics: SetMetricsState;
  updatePersistedSessionCursor: (
    sessionId: string,
    toOffset: number,
    lineCount: number,
    anomalyCount: number,
    suggestedBpm: number | null,
  ) => Promise<void>;
  insertSessionEvent: (payload: InsertSessionEventInput) => Promise<unknown>;
  logger: MonitorProviderRuntimeLogger;
  options?: {
    accumulateMetrics?: boolean;
    persistPlaybackEvent?: boolean;
  };
}) {
  return {
    update: input.update,
    listenersRef: input.listenersRef,
    sessionRef: input.sessionRef,
    pollIndexRef: input.pollIndexRef,
    audioContextRef: input.audioContextRef,
    setMetrics: input.setMetrics,
    updatePersistedCursor: (payload: PersistedMonitorCursorUpdate) =>
      void input.updatePersistedSessionCursor(
        payload.sessionId,
        payload.toOffset,
        payload.lineCount,
        payload.anomalyCount,
        payload.suggestedBpm,
      ),
    insertPersistedEvent: (payload: InsertSessionEventInput) => {
      void input.insertSessionEvent(payload);
    },
    logger: input.logger,
    options: input.options,
  };
}

export function buildRunMonitorProviderPollStateInput(input: {
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  activeRef: MutableRefObject<boolean>;
  directCursorRef: MutableRefObject<number | undefined>;
  emptyWindowsRef: MutableRefObject<number>;
  wsLineBufferRef: MutableRefObject<string[]>;
  httpUrlRef: MutableRefObject<string>;
  pollStreamSession: (sessionId: string) => Promise<StreamSessionPollResult>;
  pollLogStream: (
    sourcePath: string,
    cursor?: number,
    maxBytes?: number,
  ) => Promise<LiveLogStreamUpdate>;
  ingestStreamChunk: (sessionId: string, chunk: string) => Promise<StreamSessionPollResult>;
  fetchText: (url: string) => Promise<string>;
  emitUpdate: (update: LiveLogStreamUpdate) => void;
  schedulePoll: (doPoll: () => Promise<void>) => void;
  doPoll: () => Promise<void>;
  logger: MonitorProviderRuntimeLogger;
}) {
  return {
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
    emitUpdate: input.emitUpdate,
    schedulePoll: input.schedulePoll,
    doPoll: input.doPoll,
    logger: input.logger,
  };
}

export function buildDispatchReplayEventAtIndexStateInput(input: {
  eventIndex: number;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayIndexRef: MutableRefObject<number>;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  emitUpdate: (
    update: LiveLogStreamUpdate,
    options?: {
      accumulateMetrics?: boolean;
      persistPlaybackEvent?: boolean;
    },
  ) => void;
  syncReplayTelemetry: (processedEvents: number) => void;
  syncGuideTrackToReplayProgress: (progress: number) => void;
  syncGuideTrack?: boolean;
}) {
  return {
    eventIndex: input.eventIndex,
    replayEventsRef: input.replayEventsRef,
    replayIndexRef: input.replayIndexRef,
    sessionRef: input.sessionRef,
    emitUpdate: input.emitUpdate,
    syncReplayTelemetry: input.syncReplayTelemetry,
    syncGuideTrackToReplayProgress: input.syncGuideTrackToReplayProgress,
    syncGuideTrack: input.syncGuideTrack,
  };
}

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

export function buildSyncReplayTelemetryStateInput(input: {
  processedEvents: number;
  replayEventsRef: MutableRefObject<SessionEvent[]>;
  replayMetricsRef: MutableRefObject<MonitorMetrics[]>;
  setPlaybackEventCount: SetNullableNumberState;
  setPlaybackEventIndex: SetNullableNumberState;
  setPlaybackProgress: SetNullableNumberState;
  setMetrics: SetMetricsState;
}) {
  return {
    processedEvents: input.processedEvents,
    replayEventsRef: input.replayEventsRef,
    replayMetricsRef: input.replayMetricsRef,
    setPlaybackEventCount: input.setPlaybackEventCount,
    setPlaybackEventIndex: input.setPlaybackEventIndex,
    setPlaybackProgress: input.setPlaybackProgress,
    setMetrics: input.setMetrics,
  };
}

export function buildSyncGuideTrackCursorStateInput(input: {
  pcm: GuideTrackPCM | null;
  cursorRef: MutableRefObject<{ current: number }>;
  finishedRef: MutableRefObject<boolean>;
  progress: number;
}) {
  return {
    pcm: input.pcm,
    cursorRef: input.cursorRef,
    finishedRef: input.finishedRef,
    progress: input.progress,
  };
}

export function buildResumeMonitorAudioContextStateInput(input: {
  audioContextRef: MutableRefObject<AudioContext | null>;
  setAudioContext: Dispatch<SetStateAction<AudioContext | null>>;
  logger: MonitorProviderRuntimeLogger;
}) {
  return {
    ensureAudioContext: () => ({
      audioContextRef: input.audioContextRef,
      setAudioContext: input.setAudioContext,
      logger: input.logger,
      reason: "manual-resume" as const,
    }),
    emitProbe: (context: AudioContext) => ({
      context,
      frequency: 440,
      attackGain: 0.15,
      releaseTimeSec: 0.3,
    }),
    logger: input.logger,
  };
}
