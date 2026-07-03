import { describe, expect, it, vi } from "vitest";

import { buildMonitorProviderSessionOrchestrationDependencies } from "../../../src/features/monitor/monitorProviderSessionOrchestrationRuntime";

describe("monitorProviderSessionOrchestrationRuntime", () => {
  it("builds explicit runtime and session-action dependencies from provider state", () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };
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
      setAudioContext: vi.fn(),
      replayMetricsRef: { current: [] },
      replayHydratingRef: { current: false },
      replayHydrationTokenRef: { current: 0 },
      setPlaybackProgress: vi.fn(),
      setPlaybackEventIndex: vi.fn(),
      setPlaybackEventCount: vi.fn(),
      wsRef: { current: null as WebSocket | null },
      wsLineBufferRef: { current: [] as string[] },
      httpUrlRef: { current: "" },
      directCursorRef: { current: undefined as number | undefined },
      emptyWindowsRef: { current: 0 },
      pollIndexRef: { current: 0 },
      isPlaybackRef: { current: false },
    };
    const buildReloadPendingGuideTrack = vi.fn((reason: string) => vi.fn(() => reason));
    const transport = {
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(async () => ""),
    };
    const sessionApi = {
      startStreamSession: vi.fn(),
      stopStreamSession: vi.fn(),
      listSessionEvents: vi.fn(),
    };
    const persistence = {
      updatePersistedSessionCursor: vi.fn(async () => undefined),
      insertSessionEvent: vi.fn(async () => undefined),
      updatePersistedSessionStatus: vi.fn(async () => undefined),
    };

    const result = buildMonitorProviderSessionOrchestrationDependencies({
      state,
      logger,
      buildReloadPendingGuideTrack,
      transport,
      sessionApi,
      persistence,
    });

    expect(result.runtimeOrchestrationInput).toEqual(
      expect.objectContaining({
        logger,
        session: expect.objectContaining({
          sessionRef: state.sessionRef,
          setSession: state.setSession,
        }),
        transport: expect.objectContaining({
          pollStreamSession: transport.pollStreamSession,
          pollLogStream: transport.pollLogStream,
        }),
      }),
    );

    const sessionActionsInput = result.buildSessionActionsInput({
      stopPolling: vi.fn(),
      buildLiveStartInput: vi.fn() as never,
      ensureProviderAudioContext: vi.fn(async () => ({ state: "running" }) as AudioContext),
      replayTick: vi.fn(),
      syncReplayTelemetry: vi.fn(),
      resetReplayTelemetry: vi.fn(),
    });

    expect(sessionActionsInput).toEqual(
      expect.objectContaining({
        logger,
        session: expect.objectContaining({
          sessionRef: state.sessionRef,
          setSession: state.setSession,
        }),
        runtime: expect.objectContaining({
          stopPolling: expect.any(Function),
          buildLiveStartInput: expect.any(Function),
          replayTick: expect.any(Function),
        }),
        api: expect.objectContaining({
          startStreamSession: sessionApi.startStreamSession,
          stopStreamSession: sessionApi.stopStreamSession,
          pollLogStream: transport.pollLogStream,
        }),
      }),
    );
  });
});
