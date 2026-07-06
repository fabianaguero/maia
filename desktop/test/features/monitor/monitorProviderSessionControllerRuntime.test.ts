import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderSessionActionsInput,
  buildMonitorProviderSessionActionsInputFromState,
} from "../../../src/features/monitor/monitorProviderSessionControllerRuntime";

describe("monitorProviderSessionControllerRuntime", () => {
  it("groups provider session dependencies into explicit slices", () => {
    const input = {
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        trace: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
      },
      sessionRef: { current: null },
      setSession: vi.fn(),
      setIsPlayback: vi.fn(),
      setIsPlaybackPaused: vi.fn(),
      setMetrics: vi.fn(),
      isPlayback: false,
      activeRef: { current: false },
      isPlaybackRef: { current: false },
      directCursorRef: { current: undefined as number | undefined },
      emptyWindowsRef: { current: 0 },
      currentSegmentRef: { current: null },
      audioContextRef: { current: null },
      replayEventsRef: { current: [] },
      replayMetricsRef: { current: [] },
      replayIndexRef: { current: 0 },
      replayHydratingRef: { current: false },
      replayHydrationTokenRef: { current: 0 },
      playbackPausedRef: { current: false },
      pollTimerRef: { current: null as number | null },
      guideTrackPathRef: { current: null as string | null },
      guideTrackQueueRef: { current: [] as string[] },
      guideTrackRef: { current: null },
      guideTrackLoadPromiseRef: { current: null as Promise<void> | null },
      stopPolling: vi.fn(),
      buildLiveStartInput: vi.fn(() => ({ marker: "live-start-input" }) as never),
      ensureProviderAudioContext: vi.fn(async () => ({ state: "running" }) as AudioContext),
      replayTick: vi.fn(),
      syncReplayTelemetry: vi.fn(),
      resetReplayTelemetry: vi.fn(),
      startStreamSession: vi.fn(),
      stopStreamSession: vi.fn(),
      listSessionEvents: vi.fn(),
      updatePersistedSessionStatus: vi.fn(async () => undefined),
      pollLogStream: vi.fn(),
    };

    const result = buildMonitorProviderSessionActionsInput(input);

    expect(result).toEqual(
      expect.objectContaining({
        logger: input.logger,
        session: expect.objectContaining({
          sessionRef: input.sessionRef,
          setSession: input.setSession,
          isPlayback: false,
        }),
        live: expect.objectContaining({
          activeRef: input.activeRef,
          pollTimerRef: input.pollTimerRef,
        }),
        audio: expect.objectContaining({
          currentSegmentRef: input.currentSegmentRef,
          audioContextRef: input.audioContextRef,
        }),
        replay: expect.objectContaining({
          replayEventsRef: input.replayEventsRef,
          playbackPausedRef: input.playbackPausedRef,
        }),
        guideTrack: expect.objectContaining({
          guideTrackQueueRef: input.guideTrackQueueRef,
          guideTrackLoadPromiseRef: input.guideTrackLoadPromiseRef,
        }),
        runtime: expect.objectContaining({
          stopPolling: input.stopPolling,
          replayTick: input.replayTick,
        }),
        api: expect.objectContaining({
          startStreamSession: input.startStreamSession,
          pollLogStream: input.pollLogStream,
        }),
      }),
    );
  });

  it("builds session action input directly from grouped provider state", () => {
    const state = {
      session: null,
      metrics: { processedLines: 0, totalAnomalies: 0, windowCount: 0 },
      isPlayback: false,
      guideTrackReady: false,
      guideTrackPath: null,
      playbackProgress: null,
      isPlaybackPaused: false,
      playbackEventIndex: null,
      playbackEventCount: null,
      guideTrackDurationSec: null,
      audioContext: null,
      activeTemplate: { id: "default" } as never,
      setGuideTrackReady: vi.fn(),
      setGuideTrackPathState: vi.fn(),
      setGuideTrackDurationSec: vi.fn(),
      setActiveTemplateState: vi.fn(),
      setIsPlaybackPaused: vi.fn(),
      audioContextRef: { current: null },
      listenersRef: { current: new Set() },
      currentSegmentRef: { current: null },
      guideTrackPathRef: { current: null as string | null },
      guideTrackQueueRef: { current: [] as string[] },
      guideTrackQueueIndexRef: { current: 0 },
      guideTrackRef: { current: null },
      guideTrackCursorRef: { current: { current: 0 } },
      guideTrackFinishedRef: { current: false },
      guideTrackLoadPromiseRef: { current: null as Promise<void> | null },
      activeTemplateRef: { current: { id: "default" } as never },
      replayEventsRef: { current: [] },
      replayIndexRef: { current: 0 },
      pollTimerRef: { current: null as number | null },
      playbackPausedRef: { current: false },
      activeRef: { current: true },
      sessionRef: { current: null },
      setSession: vi.fn(),
      setIsPlayback: vi.fn(),
      setMetrics: vi.fn(),
      isPlaybackRef: { current: false },
      directCursorRef: { current: undefined as number | undefined },
      emptyWindowsRef: { current: 0 },
      replayMetricsRef: { current: [] },
      replayHydratingRef: { current: false },
      replayHydrationTokenRef: { current: 0 },
    };
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };
    const stopPolling = vi.fn();
    const buildLiveStartInput = vi.fn(() => ({ marker: "live-start-input" }) as never);
    const ensureProviderAudioContext = vi.fn(async () => ({ state: "running" }) as AudioContext);
    const replayTick = vi.fn();
    const syncReplayTelemetry = vi.fn();
    const resetReplayTelemetry = vi.fn();
    const startStreamSession = vi.fn();
    const stopStreamSession = vi.fn();
    const listSessionEvents = vi.fn();
    const updatePersistedSessionStatus = vi.fn(async () => undefined);
    const pollLogStream = vi.fn();

    const result = buildMonitorProviderSessionActionsInputFromState({
      logger,
      state,
      stopPolling,
      buildLiveStartInput,
      ensureProviderAudioContext,
      replayTick,
      syncReplayTelemetry,
      resetReplayTelemetry,
      startStreamSession,
      stopStreamSession,
      listSessionEvents,
      updatePersistedSessionStatus,
      pollLogStream,
    });

    expect(result).toEqual(
      expect.objectContaining({
        logger,
        session: expect.objectContaining({
          sessionRef: state.sessionRef,
          setSession: state.setSession,
        }),
        replay: expect.objectContaining({
          replayEventsRef: state.replayEventsRef,
          replayHydrationTokenRef: state.replayHydrationTokenRef,
        }),
        runtime: expect.objectContaining({
          stopPolling,
          replayTick,
        }),
      }),
    );
  });
});
