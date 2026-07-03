import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderSessionApiSlice,
  buildMonitorProviderSessionAudioSlice,
  buildMonitorProviderSessionGuideTrackSlice,
  buildMonitorProviderSessionLiveSlice,
  buildMonitorProviderSessionReplaySlice,
  buildMonitorProviderSessionRuntimeSlice,
  buildMonitorProviderSessionStateSlice,
} from "../../../src/features/monitor/monitorProviderSessionSliceRuntime";

describe("monitorProviderSessionSliceRuntime", () => {
  it("builds explicit session-action slices from focused inputs", () => {
    const sessionRef = { current: null };
    const setSession = vi.fn();
    const setIsPlayback = vi.fn();
    const setIsPlaybackPaused = vi.fn();
    const setMetrics = vi.fn();
    expect(
      buildMonitorProviderSessionStateSlice({
        sessionRef,
        setSession,
        setIsPlayback,
        setIsPlaybackPaused,
        setMetrics,
        isPlayback: false,
      }),
    ).toEqual({
      sessionRef,
      setSession,
      setIsPlayback,
      setIsPlaybackPaused,
      setMetrics,
      isPlayback: false,
    });

    const activeRef = { current: false };
    const isPlaybackRef = { current: false };
    const directCursorRef = { current: undefined as number | undefined };
    const emptyWindowsRef = { current: 0 };
    const pollTimerRef = { current: null as number | null };
    expect(
      buildMonitorProviderSessionLiveSlice({
        activeRef,
        isPlaybackRef,
        directCursorRef,
        emptyWindowsRef,
        pollTimerRef,
      }),
    ).toEqual({
      activeRef,
      isPlaybackRef,
      directCursorRef,
      emptyWindowsRef,
      pollTimerRef,
    });

    const currentSegmentRef = { current: null as never };
    const audioContextRef = { current: null as AudioContext | null };
    expect(
      buildMonitorProviderSessionAudioSlice({
        currentSegmentRef,
        audioContextRef,
      }),
    ).toEqual({
      currentSegmentRef,
      audioContextRef,
    });

    const replayEventsRef = { current: [] };
    const replayMetricsRef = { current: [] };
    const replayIndexRef = { current: 0 };
    const replayHydratingRef = { current: false };
    const replayHydrationTokenRef = { current: 0 };
    const playbackPausedRef = { current: false };
    expect(
      buildMonitorProviderSessionReplaySlice({
        replayEventsRef,
        replayMetricsRef,
        replayIndexRef,
        replayHydratingRef,
        replayHydrationTokenRef,
        playbackPausedRef,
      }),
    ).toEqual({
      replayEventsRef,
      replayMetricsRef,
      replayIndexRef,
      replayHydratingRef,
      replayHydrationTokenRef,
      playbackPausedRef,
    });

    const guideTrackPathRef = { current: null as string | null };
    const guideTrackQueueRef = { current: [] as string[] };
    const guideTrackRef = { current: null };
    const guideTrackLoadPromiseRef = { current: null as Promise<void> | null };
    expect(
      buildMonitorProviderSessionGuideTrackSlice({
        guideTrackPathRef,
        guideTrackQueueRef,
        guideTrackRef,
        guideTrackLoadPromiseRef,
      }),
    ).toEqual({
      guideTrackPathRef,
      guideTrackQueueRef,
      guideTrackRef,
      guideTrackLoadPromiseRef,
    });

    const stopPolling = vi.fn();
    const buildLiveStartInput = vi.fn(() => ({ marker: "live-start" }) as never);
    const ensureProviderAudioContext = vi.fn(async () => ({ state: "running" }) as AudioContext);
    const replayTick = vi.fn();
    const syncReplayTelemetry = vi.fn();
    const resetReplayTelemetry = vi.fn();
    expect(
      buildMonitorProviderSessionRuntimeSlice({
        stopPolling,
        buildLiveStartInput,
        ensureProviderAudioContext,
        replayTick,
        syncReplayTelemetry,
        resetReplayTelemetry,
      }),
    ).toEqual({
      stopPolling,
      buildLiveStartInput,
      ensureProviderAudioContext,
      replayTick,
      syncReplayTelemetry,
      resetReplayTelemetry,
    });

    const startStreamSession = vi.fn();
    const stopStreamSession = vi.fn();
    const listSessionEvents = vi.fn();
    const updatePersistedSessionStatus = vi.fn();
    const pollLogStream = vi.fn();
    expect(
      buildMonitorProviderSessionApiSlice({
        startStreamSession,
        stopStreamSession,
        listSessionEvents,
        updatePersistedSessionStatus,
        pollLogStream,
      }),
    ).toEqual({
      startStreamSession,
      stopStreamSession,
      listSessionEvents,
      updatePersistedSessionStatus,
      pollLogStream,
    });
  });
});
