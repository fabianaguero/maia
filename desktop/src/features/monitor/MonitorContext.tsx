import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { invoke } from "../../api/tauri";
import { convertFileSrc } from "@tauri-apps/api/core";
import { getLogger } from "../../utils/logger";

const log = getLogger("MonitorCtx");

import {
  DEFAULT_SOURCE_TEMPLATE_ID,
  resolveSourceTemplate,
  type SourceTemplate,
} from "../../config/sourceTemplates";
import {
  ingestStreamChunk,
  pollLogStream,
  pollStreamSession,
  startStreamSession,
  stopStreamSession,
} from "../../api/repositories";
import {
  listSessionEvents,
  updatePersistedSessionCursor,
  updatePersistedSessionStatus,
  insertSessionEvent,
} from "../../api/sessions";
import type { SessionEvent } from "../../api/sessions";
import type {
  LiveLogStreamUpdate,
  RepositoryAnalysis,
} from "../../types/library";
import type {
  StartSessionInput,
  StreamSessionRecord,
} from "../../types/monitor";
import type {
  ActiveMonitorSession,
  MonitorContextValue,
  MonitorMetrics,
  StreamListener,
} from "./monitorContextTypes";
import {
  emitMonitorAudioProbe,
  ensureMonitorAudioContext,
  type CrossfadeHandle,
  type GuideTrackPCM,
  stopAllMonitorAudio,
} from "./monitorContextRuntime";
import {
  createEmptyMonitorMetrics,
  rebuildReplayEventsFromSource,
  resetReplayTelemetryState,
  syncGuideTrackCursorToReplayProgress,
  syncReplayTelemetryState,
} from "./monitorReplayRuntime";
import {
  POLL_INTERVAL_MS,
  scheduleMonitorPoll,
  stopMonitorPollingState,
} from "./monitorSessionRuntime";
import {
  dispatchReplayEventAtIndexState,
  runReplayTickState,
} from "./monitorPlaybackRuntime";
import {
  resolveLiveMonitorPollMode,
  resumeMonitorAudioContextState,
  startLiveMonitorSessionState,
  stopLiveMonitorSessionState,
} from "./monitorLiveLifecycleRuntime";
import {
  buildGuideTrackQueue,
  loadGuideTrackPathState,
  reloadPendingGuideTrackForMonitorState,
} from "./monitorStartupRuntime";
import {
  subscribeToMonitorStreamState,
} from "./monitorUpdateRuntime";
import { buildMonitorContextValue } from "./monitorContextValue";
import {
  createGuideTrackDecodeCache,
  decodeGuideTrackFile,
  isTauriRuntime,
} from "./monitorGuideTrackDecodeRuntime";
import {
  buildMonitorProviderLiveStartBaseInput,
  replaceExistingMonitorSessionIfPresent,
} from "./monitorProviderStartRuntime";
import {
  pauseMonitorPlaybackState,
  resumeMonitorPlaybackState,
  seekMonitorPlaybackProgressState,
  seekMonitorPlaybackWindowState,
  stepMonitorPlaybackWindowState,
} from "./monitorProviderPlaybackControlsRuntime";
import {
  seekMonitorGuideTrackState,
  setMonitorActiveTemplateState,
  setMonitorGuideTrackPlaylistState,
  setMonitorGuideTrackState,
} from "./monitorProviderGuideTrackRuntime";
import {
  emitMonitorProviderUpdateState,
  runMonitorProviderPollState,
} from "./monitorProviderLiveRuntime";
import {
  attachMonitorProviderSessionState,
  startMonitorProviderSessionState,
} from "./monitorProviderSessionRuntime";
import { startMonitorProviderPlaybackSessionState } from "./monitorProviderPlaybackSessionRuntime";

const decodedAudioCache = createGuideTrackDecodeCache();

/**
 * Slice a bar from the guide track, apply log-driven modulation, return WAV.
 * The cursor advances each call, looping back to the start when the track ends.
 */

// ---------------------------------------------------------------------------
// Fallback synth — minimal musical phrase (kick + melody from cue data)
// Used when no guide track is loaded.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Context plumbing
// ---------------------------------------------------------------------------

const MonitorCtx = createContext<MonitorContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function MonitorProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ActiveMonitorSession | null>(null);
  const [isPlayback, setIsPlayback] = useState(false);
  const [metrics, setMetrics] = useState<MonitorMetrics>(createEmptyMonitorMetrics());
  const [guideTrackReady, setGuideTrackReady] = useState(false);
  const [guideTrackPath, setGuideTrackPathState] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<number | null>(null);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const [playbackEventIndex, setPlaybackEventIndex] = useState<number | null>(null);
  const [playbackEventCount, setPlaybackEventCount] = useState<number | null>(null);
  const [guideTrackDurationSec, setGuideTrackDurationSec] = useState<number | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Refs that survive across re-renders without causing them
  const pollTimerRef = useRef<number | null>(null);
  const sessionRef = useRef<ActiveMonitorSession | null>(null);
  const listenersRef = useRef<Set<StreamListener>>(new Set());
  const activeRef = useRef(false);
  /** Decoded guide track PCM data */
  const guideTrackRef = useRef<GuideTrackPCM | null>(null);
  /** Playback cursor into the guide track (sample offset) */
  const guideTrackCursorRef = useRef<{ current: number }>({ current: 0 });
  /** Flag to prevent playback loops after track reaches end */
  const guideTrackFinishedRef = useRef(false);
  /** Direct-mode cursor (browser fallback path only). */
  const directCursorRef = useRef<number | undefined>(undefined);
  /** Cached replay event list for playback + scrubbing. */
  const replayEventsRef = useRef<SessionEvent[]>([]);
  /** Prefix-sum metrics for replay windows. */
  const replayMetricsRef = useRef<MonitorMetrics[]>([
    { windowCount: 0, processedLines: 0, totalAnomalies: 0 },
  ]);
  /** Next replay event index to emit. */
  const replayIndexRef = useRef(0);
  /** True while replay windows are being reconstructed from the source file. */
  const replayHydratingRef = useRef(false);
  /** Monotonic token used to ignore stale async replay hydration results. */
  const replayHydrationTokenRef = useRef(0);
  /** Mirror of playback pause state for callbacks/timers. */
  const playbackPausedRef = useRef(false);
  /** Consecutive empty-window count for direct mode — reset cursor after N to loop static files. */
  const emptyWindowsRef = useRef(0);
  /** WebSocket instance for the "websocket" poll mode. */
  const wsRef = useRef<WebSocket | null>(null);
  /** Lines received from the WS not yet ingested into the ring buffer. */
  const wsLineBufferRef = useRef<string[]>([]);
  /** URL for the "http-poll" poll mode. */
  const httpUrlRef = useRef<string>("");
  /** Poll counter for recording session events. */
  const pollIndexRef = useRef<number>(0);
  /** Mirror of playback state for callbacks that should not close over stale state. */
  const isPlaybackRef = useRef(false);

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  const guideTrackPathRef = useRef<string | null>(null);
  const guideTrackQueueRef = useRef<string[]>([]);
  const guideTrackQueueIndexRef = useRef(0);
  const guideTrackLoadPromiseRef = useRef<Promise<void> | null>(null);

  /** Currently-playing guide track segment handle for crossfade scheduling. */
  const currentSegmentRef = useRef<CrossfadeHandle | null>(null);

  /** Active source template — read on every poll, never causes re-renders. */
  const activeTemplateRef = useRef<SourceTemplate>(
    resolveSourceTemplate(DEFAULT_SOURCE_TEMPLATE_ID),
  );

  const [activeTemplate, setActiveTemplateState] = useState<SourceTemplate>(() =>
    resolveSourceTemplate(DEFAULT_SOURCE_TEMPLATE_ID),
  );

  const setActiveTemplate = useCallback((id: string) => {
    setMonitorActiveTemplateState({
      id,
      resolveSourceTemplate,
      activeTemplateRef,
      setActiveTemplateState,
      logger: log,
    });
  }, []);

  const seekGuideTrack = useCallback((second: number) => {
    seekMonitorGuideTrackState({
      second,
      guideTrack: guideTrackRef.current,
      guideTrackCursorRef,
      guideTrackFinishedRef,
      logger: log,
    });
  }, []);

  const loadGuideTrackPath = useCallback((path: string | null) => {
    loadGuideTrackPathState({
      path,
      currentPath: guideTrackPathRef.current,
      hasGuideTrack: guideTrackRef.current !== null,
      hasPendingLoad: guideTrackLoadPromiseRef.current !== null,
      audioContextRef,
      currentSegmentRef,
      guideTrackPathRef,
      guideTrackRef,
      guideTrackCursorRef,
      guideTrackFinishedRef,
      guideTrackLoadPromiseRef,
      setGuideTrackReady,
      setGuideTrackPathState,
      setGuideTrackDurationSec,
      decodeGuideTrack: async (targetPath) =>
        decodeGuideTrackFile(targetPath, {
          cache: decodedAudioCache,
          logger: log,
          isTauri: isTauriRuntime,
          convertFileSrc,
          fetchAudio: async (url) => fetch(url),
          invokeReadAudioBytes: async (decodePath) =>
            invoke<string>("read_audio_bytes", { path: decodePath }),
          decodeBase64: (value) => atob(value),
          createOfflineAudioContext: (channels, frameCount, sampleRate) =>
            new OfflineAudioContext(channels, frameCount, sampleRate),
        }),
      logger: log,
    });
  }, []);

  const setGuideTrack = useCallback(
    (path: string | null) => {
      setMonitorGuideTrackState({
        path,
        guideTrackQueueRef,
        guideTrackQueueIndexRef,
        loadGuideTrackPath,
      });
    },
    [loadGuideTrackPath],
  );

  const setGuideTrackPlaylist = useCallback(
    (paths: string[]) => {
      setMonitorGuideTrackPlaylistState({
        paths,
        buildGuideTrackQueue,
        guideTrackQueueRef,
        guideTrackQueueIndexRef,
        loadGuideTrackPath,
      });
    },
    [loadGuideTrackPath],
  );

  const stopPolling = useCallback(() => {
    stopMonitorPollingState({
      activeRef,
      pollTimerRef,
      wsRef,
      wsLineBufferRef,
      httpUrlRef,
      clearTimeoutFn: window.clearTimeout,
    });
  }, []);

  const schedulePoll = useCallback((doPoll: () => Promise<void>) => {
    scheduleMonitorPoll({
      activeRef,
      pollTimerRef,
      intervalMs: POLL_INTERVAL_MS,
      setTimeoutFn: window.setTimeout,
      doPoll,
    });
  }, []);

  const resetReplayTelemetry = useCallback(() => {
    resetReplayTelemetryState({
      replayEventsRef,
      replayMetricsRef,
      replayIndexRef,
      replayHydratingRef,
      replayHydrationTokenRef,
      playbackPausedRef,
      setPlaybackProgress,
      setIsPlaybackPaused,
      setPlaybackEventIndex,
      setPlaybackEventCount,
    });
  }, []);

  const syncReplayTelemetry = useCallback((processedEvents: number) => {
    syncReplayTelemetryState({
      processedEvents,
      replayEventsRef,
      replayMetricsRef,
      setPlaybackEventCount,
      setPlaybackEventIndex,
      setPlaybackProgress,
      setMetrics,
    });
  }, []);

  const syncGuideTrackToReplayProgress = useCallback((progress: number) => {
    syncGuideTrackCursorToReplayProgress({
      pcm: guideTrackRef.current,
      cursorRef: guideTrackCursorRef,
      finishedRef: guideTrackFinishedRef,
      progress,
    });
  }, []);

  const emitUpdate = useCallback(
    (
      update: LiveLogStreamUpdate,
      options?: {
        accumulateMetrics?: boolean;
        persistPlaybackEvent?: boolean;
      },
    ) => {
      emitMonitorProviderUpdateState({
        update,
        listenersRef,
        sessionRef,
        pollIndexRef,
        audioContextRef,
        setMetrics,
        updatePersistedCursor: (payload) => {
          void updatePersistedSessionCursor(
            payload.sessionId,
            payload.toOffset,
            payload.lineCount,
            payload.anomalyCount,
            payload.suggestedBpm,
          );
        },
        insertPersistedEvent: (payload) => {
          void insertSessionEvent(payload);
        },
        logger: log,
        options,
      });
    },
    [],
  );

  // Map a StreamSessionPollResult to the LiveLogStreamUpdate shape expected by listeners
  // -------------------------------------------------------------------------
  // Poll loop — defined with useCallback so it's stable but always reads live
  // refs.  Self-scheduling via schedulePoll keeps the loop alive indefinitely
  // until stopPolling() is called.
  // -------------------------------------------------------------------------

  const doPoll = useCallback(async () => {
    await runMonitorProviderPollState({
      sessionRef,
      activeRef,
      directCursorRef,
      emptyWindowsRef,
      wsLineBufferRef,
      httpUrlRef,
      pollStreamSession,
      pollLogStream,
      ingestStreamChunk,
      fetchText: async (url) => {
        const response = await fetch(url);
        return response.text();
      },
      emitUpdate,
      schedulePoll,
      doPoll,
      logger: log,
    });
  }, [emitUpdate, schedulePoll]);

  const replaceExistingSessionIfPresent = useCallback(async () => {
    await replaceExistingMonitorSessionIfPresent({
      sessionRef,
      setSession,
      stopPolling,
      stopStreamSession,
    });
  }, [stopPolling]);

  const ensureProviderAudioContext = useCallback(
    () =>
      ensureMonitorAudioContext({
        audioContextRef,
        setAudioContext,
      }),
    [],
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

  const buildReloadPendingGuideTrack = useCallback(
    (reason: "session-start" | "attach-session") => () => {
      reloadPendingGuideTrackForMonitorState({
        guideTrackQueueRef,
        guideTrackQueueIndexRef,
        guideTrackRef,
        guideTrackPathRef,
        loadGuideTrackPath,
        logger: reason === "session-start" ? log : undefined,
        reason,
      });
    },
    [loadGuideTrackPath],
  );

  const buildLiveStartInput = useCallback(
    (reason: "session-start" | "attach-session", includeProbe: boolean) =>
      buildMonitorProviderLiveStartBaseInput({
        directCursorRef,
        emptyWindowsRef,
        pollIndexRef,
        activeTemplateRef,
        setActiveTemplateState,
        updatePersistedSessionStatus,
        sessionRef,
        activeRef,
        isPlaybackRef,
        setSession,
        setIsPlayback,
        setMetrics,
        resetReplayTelemetry,
        ensureAudioContext: ensureProviderAudioContext,
        emitProbe: includeProbe ? emitLiveStartProbe : undefined,
        reloadPendingGuideTrack: buildReloadPendingGuideTrack(reason),
        doPoll: runProviderPoll,
      }),
    [
      resetReplayTelemetry,
      ensureProviderAudioContext,
      emitLiveStartProbe,
      buildReloadPendingGuideTrack,
      runProviderPoll,
    ],
  );

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  const startSession = useCallback(
    async (
      repo: RepositoryAnalysis,
      input: StartSessionInput,
      persistedSessionId?: string,
    ): Promise<boolean> => {
      return startMonitorProviderSessionState({
        repo,
        sessionInput: input,
        persistedSessionId,
        sessionRef,
        replaceExistingSessionIfPresent,
        resolveLiveMonitorPollMode: async ({ sessionInput }) =>
          resolveLiveMonitorPollMode({
            sessionInput,
            startStreamSession,
          }),
        startLiveMonitorSession: startLiveMonitorSessionState,
        liveStartInput: buildLiveStartInput("session-start", true),
        logger: log,
      });
    },
    [replaceExistingSessionIfPresent, buildLiveStartInput],
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
    }): Promise<boolean> => {
      return attachMonitorProviderSessionState({
        sessionRecord,
        repoId,
        repoTitle,
        trackId,
        trackTitle,
        sourceTemplateId: sourceTemplateId ?? null,
        persistedSessionId,
        sessionRef,
        replaceExistingSessionIfPresent,
        startLiveMonitorSession: startLiveMonitorSessionState,
        liveStartInput: buildLiveStartInput("attach-session", false),
        logger: log,
      });
    },
    [replaceExistingSessionIfPresent, buildLiveStartInput],
  );

  // -------------------------------------------------------------------------
  // Playback — replay stored session events through the listener pipeline
  // -------------------------------------------------------------------------

  const dispatchReplayEventAtIndex = useCallback(
    (eventIndex: number, options?: { syncGuideTrack?: boolean }) => {
      return dispatchReplayEventAtIndexState({
        eventIndex,
        replayEventsRef,
        replayIndexRef,
        sessionRef,
        emitUpdate,
        syncReplayTelemetry,
        syncGuideTrackToReplayProgress,
        syncGuideTrack: options?.syncGuideTrack,
      });
    },
    [emitUpdate, syncGuideTrackToReplayProgress, syncReplayTelemetry],
  );

  const replayTick = useCallback(() => {
    runReplayTickState({
      activeRef,
      playbackPausedRef,
      replayEventsRef,
      replayIndexRef,
      replayHydratingRef,
      pollTimerRef,
      setTimeoutFn: window.setTimeout,
      intervalMs: POLL_INTERVAL_MS,
      dispatchReplayEventAtIndex: (eventIndex) => dispatchReplayEventAtIndex(eventIndex),
      syncReplayTelemetry,
      setIsPlaybackPaused,
      stopAllMonitorAudio,
      logger: log,
      replayTick,
    });
  }, [dispatchReplayEventAtIndex, syncReplayTelemetry]);

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
    }): Promise<boolean> => {
      return startMonitorProviderPlaybackSessionState({
        sessionId,
        label,
        sourcePath,
        repoId,
        sessionRef,
        stopPolling,
        loadSessionEvents: listSessionEvents,
        activeRef,
        isPlaybackRef,
        playbackPausedRef,
        replayEventsRef,
        replayMetricsRef,
        replayIndexRef,
        replayHydratingRef,
        replayHydrationTokenRef,
        pollTimerRef,
        setSession,
        setIsPlayback,
        setIsPlaybackPaused,
        setMetrics,
        syncReplayTelemetry,
        ensureAudioContext: ensureProviderAudioContext,
        guideTrackPathRef,
        guideTrackQueueRef,
        guideTrackRef,
        guideTrackLoadPromiseRef,
        awaitGuideTrack: async () => guideTrackLoadPromiseRef.current ? guideTrackLoadPromiseRef.current : undefined,
        replayTick,
        rebuildReplayEventsFromSource: ({ sessionId: targetSessionId, sourcePath: targetPath }) =>
          rebuildReplayEventsFromSource({
            sessionId: targetSessionId,
            sourcePath: targetPath,
            pollLogStream,
          }),
        setTimeoutFn: window.setTimeout,
        logger: log,
      });
    },
    [stopPolling, replayTick, syncReplayTelemetry, ensureProviderAudioContext],
  );

  const seekPlaybackProgress = useCallback(
    (progress: number) => {
      seekMonitorPlaybackProgressState({
        isPlayback,
        progress,
        replayEventsRef,
        replayIndexRef,
        pollTimerRef,
        playbackPausedRef,
        activeRef,
        guideTrackFinishedRef,
        dispatchReplayEventAtIndex,
        clearTimeoutFn: window.clearTimeout,
        setTimeoutFn: window.setTimeout,
        intervalMs: POLL_INTERVAL_MS,
        replayTick,
      });
    },
    [dispatchReplayEventAtIndex, isPlayback, replayTick],
  );

  const seekPlaybackWindow = useCallback(
    (replayWindowIndex: number) => {
      seekMonitorPlaybackWindowState({
        isPlayback,
        replayWindowIndex,
        replayEventsRef,
        seekPlaybackProgress,
      });
    },
    [isPlayback, seekPlaybackProgress],
  );

  const pausePlayback = useCallback(() => {
    pauseMonitorPlaybackState({
      isPlayback,
      pollTimerRef,
      playbackPausedRef,
      activeRef,
      setIsPlaybackPaused,
      clearTimeoutFn: window.clearTimeout,
    });
  }, [isPlayback]);

  const resumePlayback = useCallback(() => {
    resumeMonitorPlaybackState({
      isPlayback,
      replayEventsRef,
      replayIndexRef,
      pollTimerRef,
      playbackPausedRef,
      activeRef,
      guideTrackFinishedRef,
      dispatchReplayEventAtIndex,
      setIsPlaybackPaused,
      clearTimeoutFn: window.clearTimeout,
      setTimeoutFn: window.setTimeout,
      intervalMs: POLL_INTERVAL_MS,
      replayTick,
    });
  }, [dispatchReplayEventAtIndex, isPlayback, replayTick]);

  const stepPlaybackWindow = useCallback(
    (direction: -1 | 1) => {
      stepMonitorPlaybackWindowState({
        isPlayback,
        direction,
        replayEventsRef,
        replayIndexRef,
        pollTimerRef,
        playbackPausedRef,
        activeRef,
        guideTrackFinishedRef,
        dispatchReplayEventAtIndex,
        setIsPlaybackPaused,
        clearTimeoutFn: window.clearTimeout,
      });
    },
    [dispatchReplayEventAtIndex, isPlayback],
  );

  const stopSession = useCallback(async (): Promise<void> => {
    const current = sessionRef.current;
    const wasPlayback = isPlayback;
    log.info("stopSession id=%s wasPlayback=%s", current?.sessionId, wasPlayback);

    await stopLiveMonitorSessionState({
      session: current,
      wasPlayback,
      stopAllMonitorAudio,
      currentSegmentRef,
      audioContextRef,
      stopPolling,
      sessionRef,
      directCursorRef,
      emptyWindowsRef,
      activeRef,
      isPlaybackRef,
      setSession,
      setIsPlayback,
      setMetrics,
      resetReplayTelemetry,
      updatePersistedSessionStatus,
      stopStreamSession,
    });
  }, [stopPolling, isPlayback, resetReplayTelemetry]);

  const subscribe = useCallback((listener: StreamListener): (() => void) => {
    return subscribeToMonitorStreamState({
      listeners: listenersRef.current,
      listener,
      logger: log,
    });
  }, []);

  const resumeAudio = useCallback(async () => {
    await resumeMonitorAudioContextState({
      ensureAudioContext: () =>
        ensureMonitorAudioContext({
          audioContextRef,
          setAudioContext,
          logger: log,
          reason: "manual-resume",
        }),
      emitProbe: (context) => {
        emitMonitorAudioProbe({
          context,
          frequency: 440,
          attackGain: 0.15,
          releaseTimeSec: 0.3,
        });
      },
      logger: log,
    });
  }, []);

  const value = useMemo(
    () =>
      buildMonitorContextValue({
        session,
        metrics,
        isPlayback,
        isPlaybackPaused,
        guideTrackReady,
        guideTrackPath,
        setGuideTrack,
        setGuideTrackPlaylist,
        seekGuideTrack,
        startSession,
        attachSession,
        stopSession,
        playbackSession,
        seekPlaybackProgress,
        seekPlaybackWindow,
        pausePlayback,
        resumePlayback,
        stepPlaybackWindow,
        subscribe,
        playbackProgress,
        playbackEventIndex,
        playbackEventCount,
        guideTrackDurationSec,
        audioContext,
        resumeAudio,
        activeTemplate,
        setActiveTemplate,
      }),
    [
      session,
      metrics,
      isPlayback,
      isPlaybackPaused,
      guideTrackReady,
      guideTrackPath,
      setGuideTrack,
      setGuideTrackPlaylist,
      seekGuideTrack,
      startSession,
      attachSession,
      stopSession,
      playbackSession,
      seekPlaybackProgress,
      seekPlaybackWindow,
      pausePlayback,
      resumePlayback,
      stepPlaybackWindow,
      subscribe,
      playbackProgress,
      playbackEventIndex,
      playbackEventCount,
      guideTrackDurationSec,
      audioContext,
      resumeAudio,
      activeTemplate,
      setActiveTemplate,
    ],
  );

  return <MonitorCtx.Provider value={value}>{children}</MonitorCtx.Provider>;
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

export function useMonitor(): MonitorContextValue {
  const ctx = useContext(MonitorCtx);
  if (!ctx) {
    throw new Error("useMonitor must be called inside <MonitorProvider>");
  }
  return ctx;
}

export type {
  ActiveMonitorSession,
  MonitorContextValue,
  MonitorMetrics,
} from "./monitorContextTypes";
