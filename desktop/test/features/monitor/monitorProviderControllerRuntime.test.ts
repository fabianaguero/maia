import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderRuntimeOrchestrationInput,
  buildMonitorProviderRuntimeOrchestrationInputFromState,
} from "../../../src/features/monitor/monitorProviderControllerRuntime";

describe("monitorProviderControllerRuntime", () => {
  it("groups monitor provider orchestration dependencies into explicit runtime slices", async () => {
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
      setMetrics: vi.fn(),
      audioContextRef: { current: null },
      setAudioContext: vi.fn(),
      guideTrackRef: { current: null },
      guideTrackCursorRef: { current: { current: 0 } },
      guideTrackFinishedRef: { current: false },
      replayEventsRef: { current: [] },
      replayMetricsRef: { current: [] },
      replayIndexRef: { current: 0 },
      replayHydratingRef: { current: false },
      replayHydrationTokenRef: { current: 0 },
      playbackPausedRef: { current: false },
      setPlaybackProgress: vi.fn(),
      setIsPlaybackPaused: vi.fn(),
      setPlaybackEventIndex: vi.fn(),
      setPlaybackEventCount: vi.fn(),
      activeRef: { current: true },
      pollTimerRef: { current: null as number | null },
      wsRef: { current: null as WebSocket | null },
      wsLineBufferRef: { current: [] as string[] },
      httpUrlRef: { current: "" },
      directCursorRef: { current: undefined as number | undefined },
      emptyWindowsRef: { current: 0 },
      pollIndexRef: { current: 0 },
      isPlaybackRef: { current: false },
      listenersRef: { current: new Set() },
      activeTemplateRef: { current: { id: "default" } as never },
      setActiveTemplateState: vi.fn(),
      buildReloadPendingGuideTrack: vi.fn((reason: string) => vi.fn(() => reason)),
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(async () => ""),
      updatePersistedSessionCursor: vi.fn(async () => undefined),
      insertSessionEvent: vi.fn(async () => undefined),
      updatePersistedSessionStatus: vi.fn(async () => undefined),
    };

    const result = buildMonitorProviderRuntimeOrchestrationInput(input);

    expect(result).toEqual(
      expect.objectContaining({
        logger: input.logger,
        session: expect.objectContaining({
          sessionRef: input.sessionRef,
          setSession: input.setSession,
          setIsPlayback: input.setIsPlayback,
          setMetrics: input.setMetrics,
        }),
        audio: expect.objectContaining({
          audioContextRef: input.audioContextRef,
          setAudioContext: input.setAudioContext,
          guideTrackRef: input.guideTrackRef,
        }),
        playback: expect.objectContaining({
          replayEventsRef: input.replayEventsRef,
          setPlaybackProgress: input.setPlaybackProgress,
          setPlaybackEventCount: input.setPlaybackEventCount,
        }),
        live: expect.objectContaining({
          activeRef: input.activeRef,
          listenersRef: input.listenersRef,
          pollTimerRef: input.pollTimerRef,
        }),
        template: expect.objectContaining({
          activeTemplateRef: input.activeTemplateRef,
          buildReloadPendingGuideTrack: input.buildReloadPendingGuideTrack,
        }),
        transport: expect.objectContaining({
          pollStreamSession: input.pollStreamSession,
          fetchText: input.fetchText,
        }),
        persistence: expect.objectContaining({
          updatePersistedSessionCursor: input.updatePersistedSessionCursor,
          insertSessionEvent: input.insertSessionEvent,
          updatePersistedSessionStatus: input.updatePersistedSessionStatus,
        }),
      }),
    );
  });

  it("builds orchestration input directly from grouped provider state", () => {
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
    const pollStreamSession = vi.fn();
    const pollLogStream = vi.fn();
    const ingestStreamChunk = vi.fn();
    const fetchText = vi.fn(async () => "");
    const updatePersistedSessionCursor = vi.fn(async () => undefined);
    const insertSessionEvent = vi.fn(async () => undefined);
    const updatePersistedSessionStatus = vi.fn(async () => undefined);
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    const result = buildMonitorProviderRuntimeOrchestrationInputFromState({
      logger,
      state,
      buildReloadPendingGuideTrack,
      pollStreamSession,
      pollLogStream,
      ingestStreamChunk,
      fetchText,
      updatePersistedSessionCursor,
      insertSessionEvent,
      updatePersistedSessionStatus,
    });

    expect(result).toEqual(
      expect.objectContaining({
        logger,
        session: expect.objectContaining({
          sessionRef: state.sessionRef,
          setSession: state.setSession,
        }),
        audio: expect.objectContaining({
          audioContextRef: state.audioContextRef,
          setAudioContext: state.setAudioContext,
        }),
        live: expect.objectContaining({
          activeRef: state.activeRef,
          listenersRef: state.listenersRef,
        }),
      }),
    );
  });
});
