import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderRuntimeAudioSlice,
  buildMonitorProviderRuntimeLiveSlice,
  buildMonitorProviderRuntimePersistenceSlice,
  buildMonitorProviderRuntimePlaybackSlice,
  buildMonitorProviderRuntimeSessionSlice,
  buildMonitorProviderRuntimeTemplateSlice,
  buildMonitorProviderRuntimeTransportSlice,
} from "../../../src/features/monitor/monitorProviderControllerSliceRuntime";

describe("monitorProviderControllerSliceRuntime", () => {
  it("builds explicit orchestration slices from focused inputs", () => {
    const sessionRef = { current: null };
    const setSession = vi.fn();
    const setIsPlayback = vi.fn();
    const setMetrics = vi.fn();
    expect(
      buildMonitorProviderRuntimeSessionSlice({
        sessionRef,
        setSession,
        setIsPlayback,
        setMetrics,
      }),
    ).toEqual({
      sessionRef,
      setSession,
      setIsPlayback,
      setMetrics,
    });

    const audioContextRef = { current: null as AudioContext | null };
    const setAudioContext = vi.fn();
    const guideTrackRef = { current: null };
    const guideTrackCursorRef = { current: { current: 0 } };
    const guideTrackFinishedRef = { current: false };
    expect(
      buildMonitorProviderRuntimeAudioSlice({
        audioContextRef,
        setAudioContext,
        guideTrackRef,
        guideTrackCursorRef,
        guideTrackFinishedRef,
      }),
    ).toEqual({
      audioContextRef,
      setAudioContext,
      guideTrackRef,
      guideTrackCursorRef,
      guideTrackFinishedRef,
    });

    const replayEventsRef = { current: [] };
    const replayMetricsRef = { current: [] };
    const replayIndexRef = { current: 0 };
    const replayHydratingRef = { current: false };
    const replayHydrationTokenRef = { current: 0 };
    const playbackPausedRef = { current: false };
    const setPlaybackProgress = vi.fn();
    const setIsPlaybackPaused = vi.fn();
    const setPlaybackEventIndex = vi.fn();
    const setPlaybackEventCount = vi.fn();
    expect(
      buildMonitorProviderRuntimePlaybackSlice({
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
      }),
    ).toEqual({
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

    const activeRef = { current: true };
    const pollTimerRef = { current: null as number | null };
    const wsRef = { current: null as WebSocket | null };
    const wsLineBufferRef = { current: [] as string[] };
    const httpUrlRef = { current: "" };
    const directCursorRef = { current: undefined as number | undefined };
    const emptyWindowsRef = { current: 0 };
    const pollIndexRef = { current: 0 };
    const isPlaybackRef = { current: false };
    const listenersRef = { current: new Set() };
    expect(
      buildMonitorProviderRuntimeLiveSlice({
        activeRef,
        pollTimerRef,
        wsRef,
        wsLineBufferRef,
        httpUrlRef,
        directCursorRef,
        emptyWindowsRef,
        pollIndexRef,
        isPlaybackRef,
        listenersRef,
      }),
    ).toEqual({
      activeRef,
      pollTimerRef,
      wsRef,
      wsLineBufferRef,
      httpUrlRef,
      directCursorRef,
      emptyWindowsRef,
      pollIndexRef,
      isPlaybackRef,
      listenersRef,
    });

    const activeTemplateRef = { current: { id: "default" } as never };
    const setActiveTemplateState = vi.fn();
    const buildReloadPendingGuideTrack = vi.fn(() => vi.fn());
    expect(
      buildMonitorProviderRuntimeTemplateSlice({
        activeTemplateRef,
        setActiveTemplateState,
        buildReloadPendingGuideTrack,
      }),
    ).toEqual({
      activeTemplateRef,
      setActiveTemplateState,
      buildReloadPendingGuideTrack,
    });

    const pollStreamSession = vi.fn();
    const pollLogStream = vi.fn();
    const ingestStreamChunk = vi.fn();
    const fetchText = vi.fn(async () => "");
    expect(
      buildMonitorProviderRuntimeTransportSlice({
        pollStreamSession,
        pollLogStream,
        ingestStreamChunk,
        fetchText,
      }),
    ).toEqual({
      pollStreamSession,
      pollLogStream,
      ingestStreamChunk,
      fetchText,
    });

    const updatePersistedSessionCursor = vi.fn();
    const insertSessionEvent = vi.fn();
    const updatePersistedSessionStatus = vi.fn();
    expect(
      buildMonitorProviderRuntimePersistenceSlice({
        updatePersistedSessionCursor,
        insertSessionEvent,
        updatePersistedSessionStatus,
      }),
    ).toEqual({
      updatePersistedSessionCursor,
      insertSessionEvent,
      updatePersistedSessionStatus,
    });
  });
});
