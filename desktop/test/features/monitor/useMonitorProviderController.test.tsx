import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    trace: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
  resolveSourceTemplate: vi.fn(),
  createGuideTrackDecodeCache: vi.fn(() => ({ cache: "decoded-audio" })),
  useMonitorProviderState: vi.fn(),
  useMonitorProviderGuideTrack: vi.fn(),
  useMonitorProviderRuntimeOrchestration: vi.fn(),
  useMonitorProviderSessionActions: vi.fn(),
  useMonitorProviderPlaybackControls: vi.fn(),
  useMonitorProviderContextValue: vi.fn(),
  startStreamSession: vi.fn(),
  stopStreamSession: vi.fn(),
  pollStreamSession: vi.fn(),
  pollLogStream: vi.fn(),
  ingestStreamChunk: vi.fn(),
  listSessionEvents: vi.fn(),
  updatePersistedSessionCursor: vi.fn(),
  updatePersistedSessionStatus: vi.fn(),
  insertSessionEvent: vi.fn(),
}));

vi.mock("../../../src/utils/logger", () => ({
  getLogger: vi.fn(() => mocks.logger),
}));

vi.mock("../../../src/config/sourceTemplates", () => ({
  DEFAULT_SOURCE_TEMPLATE_ID: "default-template",
  resolveSourceTemplate: (...args: unknown[]) => mocks.resolveSourceTemplate(...args),
}));

vi.mock("../../../src/api/repositories", () => ({
  startStreamSession: (...args: unknown[]) => mocks.startStreamSession(...args),
  stopStreamSession: (...args: unknown[]) => mocks.stopStreamSession(...args),
  pollStreamSession: (...args: unknown[]) => mocks.pollStreamSession(...args),
  pollLogStream: (...args: unknown[]) => mocks.pollLogStream(...args),
  ingestStreamChunk: (...args: unknown[]) => mocks.ingestStreamChunk(...args),
}));

vi.mock("../../../src/api/sessions", () => ({
  listSessionEvents: (...args: unknown[]) => mocks.listSessionEvents(...args),
  updatePersistedSessionCursor: (...args: unknown[]) => mocks.updatePersistedSessionCursor(...args),
  updatePersistedSessionStatus: (...args: unknown[]) => mocks.updatePersistedSessionStatus(...args),
  insertSessionEvent: (...args: unknown[]) => mocks.insertSessionEvent(...args),
}));

vi.mock("../../../src/features/monitor/monitorGuideTrackDecodeRuntime", () => ({
  createGuideTrackDecodeCache: (...args: unknown[]) => mocks.createGuideTrackDecodeCache(...args),
}));

vi.mock("../../../src/features/monitor/useMonitorProviderState", () => ({
  useMonitorProviderState: (...args: unknown[]) => mocks.useMonitorProviderState(...args),
}));

vi.mock("../../../src/features/monitor/useMonitorProviderGuideTrack", () => ({
  useMonitorProviderGuideTrack: (...args: unknown[]) => mocks.useMonitorProviderGuideTrack(...args),
}));

vi.mock("../../../src/features/monitor/useMonitorProviderRuntimeOrchestration", () => ({
  useMonitorProviderRuntimeOrchestration: (...args: unknown[]) =>
    mocks.useMonitorProviderRuntimeOrchestration(...args),
}));

vi.mock("../../../src/features/monitor/useMonitorProviderSessionActions", () => ({
  useMonitorProviderSessionActions: (...args: unknown[]) =>
    mocks.useMonitorProviderSessionActions(...args),
}));

vi.mock("../../../src/features/monitor/useMonitorProviderPlaybackControls", () => ({
  useMonitorProviderPlaybackControls: (...args: unknown[]) =>
    mocks.useMonitorProviderPlaybackControls(...args),
}));

vi.mock("../../../src/features/monitor/useMonitorProviderContextValue", () => ({
  useMonitorProviderContextValue: (...args: unknown[]) =>
    mocks.useMonitorProviderContextValue(...args),
}));

import { useMonitorProviderController } from "../../../src/features/monitor/useMonitorProviderController";

function createState() {
  return {
    session: { sessionId: "session-1" },
    setSession: vi.fn(),
    isPlayback: true,
    setIsPlayback: vi.fn(),
    metrics: { totalAnomalies: 3, totalLines: 12 },
    setMetrics: vi.fn(),
    guideTrackReady: true,
    setGuideTrackReady: vi.fn(),
    guideTrackPath: "/tracks/base.wav",
    setGuideTrackPathState: vi.fn(),
    playbackProgress: 0.4,
    setPlaybackProgress: vi.fn(),
    isPlaybackPaused: false,
    setIsPlaybackPaused: vi.fn(),
    playbackEventIndex: 4,
    setPlaybackEventIndex: vi.fn(),
    playbackEventCount: 10,
    setPlaybackEventCount: vi.fn(),
    guideTrackDurationSec: 180,
    setGuideTrackDurationSec: vi.fn(),
    audioContext: { state: "running" },
    setAudioContext: vi.fn(),
    activeTemplate: { id: "template-active", label: "Active template" },
    setActiveTemplateState: vi.fn(),
    audioContextRef: { current: null },
    pollTimerRef: { current: null },
    sessionRef: { current: null },
    listenersRef: { current: new Set() },
    activeRef: { current: true },
    guideTrackRef: { current: null },
    guideTrackCursorRef: { current: { current: 0 } },
    guideTrackFinishedRef: { current: false },
    directCursorRef: { current: 24 },
    replayEventsRef: { current: [] },
    replayMetricsRef: { current: [] },
    replayIndexRef: { current: 0 },
    replayHydratingRef: { current: false },
    replayHydrationTokenRef: { current: 0 },
    playbackPausedRef: { current: false },
    emptyWindowsRef: { current: 0 },
    wsRef: { current: null },
    wsLineBufferRef: { current: [] },
    httpUrlRef: { current: "" },
    pollIndexRef: { current: 0 },
    isPlaybackRef: { current: false },
    guideTrackPathRef: { current: null },
    guideTrackQueueRef: { current: [] },
    guideTrackQueueIndexRef: { current: 0 },
    guideTrackLoadPromiseRef: { current: null },
    currentSegmentRef: { current: null },
    activeTemplateRef: { current: { id: "template-active", label: "Active template" } },
  };
}

describe("useMonitorProviderController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveSourceTemplate.mockReturnValue({
      id: "template-default",
      label: "Default template",
    });
    mocks.useMonitorProviderState.mockReturnValue(createState());
    mocks.useMonitorProviderGuideTrack.mockReturnValue({
      setActiveTemplate: vi.fn(),
      seekGuideTrack: vi.fn(),
      setGuideTrack: vi.fn(),
      setGuideTrackPlaylist: vi.fn(),
      buildReloadPendingGuideTrack: vi.fn(() => vi.fn()),
    });
    mocks.useMonitorProviderRuntimeOrchestration.mockReturnValue({
      stopPolling: vi.fn(),
      resetReplayTelemetry: vi.fn(),
      syncReplayTelemetry: vi.fn(),
      dispatchReplayEventAtIndex: vi.fn(),
      replayTick: vi.fn(),
      resumeAudio: vi.fn(),
      ensureProviderAudioContext: vi.fn(),
      buildLiveStartInput: vi.fn(),
    });
    mocks.useMonitorProviderSessionActions.mockReturnValue({
      startSession: vi.fn(),
      attachSession: vi.fn(),
      playbackSession: vi.fn(),
      stopSession: vi.fn(),
    });
    mocks.useMonitorProviderPlaybackControls.mockReturnValue({
      seekPlaybackProgress: vi.fn(),
      seekPlaybackWindow: vi.fn(),
      pausePlayback: vi.fn(),
      resumePlayback: vi.fn(),
      stepPlaybackWindow: vi.fn(),
    });
    mocks.useMonitorProviderContextValue.mockReturnValue({
      marker: "context-value",
    });
  });

  it("composes monitor sub-hooks into a context value", async () => {
    const { result } = renderHook(() => useMonitorProviderController());

    expect(mocks.resolveSourceTemplate).toHaveBeenCalledWith("default-template");
    expect(mocks.useMonitorProviderState).toHaveBeenCalledWith({
      initialTemplate: {
        id: "template-default",
        label: "Default template",
      },
    });

    const state = mocks.useMonitorProviderState.mock.results[0]?.value;
    const guideTrack = mocks.useMonitorProviderGuideTrack.mock.results[0]?.value;
    const orchestration = mocks.useMonitorProviderRuntimeOrchestration.mock.results[0]?.value;
    const sessionActions = mocks.useMonitorProviderSessionActions.mock.results[0]?.value;
    const playbackControls = mocks.useMonitorProviderPlaybackControls.mock.results[0]?.value;
    const guideTrackArgs = mocks.useMonitorProviderGuideTrack.mock.calls[0]?.[0];
    const orchestrationArgs = mocks.useMonitorProviderRuntimeOrchestration.mock.calls[0]?.[0];

    expect(mocks.useMonitorProviderGuideTrack).toHaveBeenCalledWith(
      expect.objectContaining({
        resolveSourceTemplate: expect.any(Function),
        decodedAudioCache: { cache: "decoded-audio" },
        logger: mocks.logger,
        audioContextRef: state.audioContextRef,
        currentSegmentRef: state.currentSegmentRef,
        guideTrackPathRef: state.guideTrackPathRef,
        guideTrackQueueRef: state.guideTrackQueueRef,
        guideTrackQueueIndexRef: state.guideTrackQueueIndexRef,
        guideTrackRef: state.guideTrackRef,
        guideTrackCursorRef: state.guideTrackCursorRef,
        guideTrackFinishedRef: state.guideTrackFinishedRef,
        guideTrackLoadPromiseRef: state.guideTrackLoadPromiseRef,
        activeTemplateRef: state.activeTemplateRef,
        setGuideTrackReady: state.setGuideTrackReady,
        setGuideTrackPathState: state.setGuideTrackPathState,
        setGuideTrackDurationSec: state.setGuideTrackDurationSec,
        setActiveTemplateState: state.setActiveTemplateState,
      }),
    );

    guideTrackArgs.resolveSourceTemplate("template-house");
    expect(mocks.resolveSourceTemplate).toHaveBeenCalledWith("template-house");

    expect(mocks.useMonitorProviderRuntimeOrchestration).toHaveBeenCalledWith(
      expect.objectContaining({
        logger: mocks.logger,
        session: expect.objectContaining({
          sessionRef: state.sessionRef,
          setSession: state.setSession,
          setIsPlayback: state.setIsPlayback,
          setMetrics: state.setMetrics,
        }),
        audio: expect.objectContaining({
          audioContextRef: state.audioContextRef,
          setAudioContext: state.setAudioContext,
          guideTrackRef: state.guideTrackRef,
          guideTrackCursorRef: state.guideTrackCursorRef,
          guideTrackFinishedRef: state.guideTrackFinishedRef,
        }),
        playback: expect.objectContaining({
          replayEventsRef: state.replayEventsRef,
          replayMetricsRef: state.replayMetricsRef,
          replayIndexRef: state.replayIndexRef,
          replayHydratingRef: state.replayHydratingRef,
          replayHydrationTokenRef: state.replayHydrationTokenRef,
          playbackPausedRef: state.playbackPausedRef,
          setPlaybackProgress: state.setPlaybackProgress,
          setIsPlaybackPaused: state.setIsPlaybackPaused,
          setPlaybackEventIndex: state.setPlaybackEventIndex,
          setPlaybackEventCount: state.setPlaybackEventCount,
        }),
        live: expect.objectContaining({
          activeRef: state.activeRef,
          pollTimerRef: state.pollTimerRef,
          wsRef: state.wsRef,
          wsLineBufferRef: state.wsLineBufferRef,
          httpUrlRef: state.httpUrlRef,
          directCursorRef: state.directCursorRef,
          emptyWindowsRef: state.emptyWindowsRef,
          pollIndexRef: state.pollIndexRef,
          isPlaybackRef: state.isPlaybackRef,
          listenersRef: state.listenersRef,
        }),
        template: expect.objectContaining({
          activeTemplateRef: state.activeTemplateRef,
          setActiveTemplateState: state.setActiveTemplateState,
          buildReloadPendingGuideTrack: guideTrack.buildReloadPendingGuideTrack,
        }),
        transport: expect.objectContaining({
          pollStreamSession: expect.any(Function),
          pollLogStream: expect.any(Function),
          ingestStreamChunk: expect.any(Function),
          fetchText: expect.any(Function),
        }),
        persistence: expect.objectContaining({
          updatePersistedSessionCursor: expect.any(Function),
          insertSessionEvent: expect.any(Function),
          updatePersistedSessionStatus: expect.any(Function),
        }),
      }),
    );

    globalThis.fetch = vi.fn(async () => ({
      text: async () => "stream-text",
    })) as never;
    mocks.insertSessionEvent.mockResolvedValueOnce(42);

    expect(await orchestrationArgs.transport.fetchText("https://logs.example")).toBe("stream-text");
    expect(globalThis.fetch).toHaveBeenCalledWith("https://logs.example");

    await orchestrationArgs.persistence.insertSessionEvent({ sessionId: "persisted-1" });
    expect(mocks.insertSessionEvent).toHaveBeenCalledWith({ sessionId: "persisted-1" });

    expect(mocks.useMonitorProviderSessionActions).toHaveBeenCalledWith(
      expect.objectContaining({
        logger: mocks.logger,
        session: expect.objectContaining({
          sessionRef: state.sessionRef,
          setSession: state.setSession,
          setIsPlayback: state.setIsPlayback,
          setIsPlaybackPaused: state.setIsPlaybackPaused,
          setMetrics: state.setMetrics,
          isPlayback: state.isPlayback,
        }),
        live: expect.objectContaining({
          activeRef: state.activeRef,
          isPlaybackRef: state.isPlaybackRef,
          directCursorRef: state.directCursorRef,
          emptyWindowsRef: state.emptyWindowsRef,
          pollTimerRef: state.pollTimerRef,
        }),
        audio: expect.objectContaining({
          currentSegmentRef: state.currentSegmentRef,
          audioContextRef: state.audioContextRef,
        }),
        replay: expect.objectContaining({
          replayEventsRef: state.replayEventsRef,
          replayMetricsRef: state.replayMetricsRef,
          replayIndexRef: state.replayIndexRef,
          replayHydratingRef: state.replayHydratingRef,
          replayHydrationTokenRef: state.replayHydrationTokenRef,
          playbackPausedRef: state.playbackPausedRef,
        }),
        guideTrack: expect.objectContaining({
          guideTrackPathRef: state.guideTrackPathRef,
          guideTrackQueueRef: state.guideTrackQueueRef,
          guideTrackRef: state.guideTrackRef,
          guideTrackLoadPromiseRef: state.guideTrackLoadPromiseRef,
        }),
        runtime: expect.objectContaining({
          stopPolling: orchestration.stopPolling,
          buildLiveStartInput: orchestration.buildLiveStartInput,
          ensureProviderAudioContext: orchestration.ensureProviderAudioContext,
          replayTick: orchestration.replayTick,
          syncReplayTelemetry: orchestration.syncReplayTelemetry,
          resetReplayTelemetry: orchestration.resetReplayTelemetry,
        }),
        api: expect.objectContaining({
          startStreamSession: expect.any(Function),
          stopStreamSession: expect.any(Function),
          listSessionEvents: expect.any(Function),
          updatePersistedSessionStatus: expect.any(Function),
          pollLogStream: expect.any(Function),
        }),
      }),
    );

    expect(mocks.useMonitorProviderPlaybackControls).toHaveBeenCalledWith({
      isPlayback: state.isPlayback,
      replayEventsRef: state.replayEventsRef,
      replayIndexRef: state.replayIndexRef,
      pollTimerRef: state.pollTimerRef,
      playbackPausedRef: state.playbackPausedRef,
      activeRef: state.activeRef,
      guideTrackFinishedRef: state.guideTrackFinishedRef,
      dispatchReplayEventAtIndex: orchestration.dispatchReplayEventAtIndex,
      replayTick: orchestration.replayTick,
      setIsPlaybackPaused: state.setIsPlaybackPaused,
      intervalMs: 600,
    });

    expect(mocks.useMonitorProviderContextValue).toHaveBeenCalledWith({
      session: state.session,
      metrics: state.metrics,
      isPlayback: state.isPlayback,
      guideTrackReady: state.guideTrackReady,
      guideTrackPath: state.guideTrackPath,
      playbackProgress: state.playbackProgress,
      isPlaybackPaused: state.isPlaybackPaused,
      playbackEventIndex: state.playbackEventIndex,
      playbackEventCount: state.playbackEventCount,
      guideTrackDurationSec: state.guideTrackDurationSec,
      setGuideTrack: guideTrack.setGuideTrack,
      setGuideTrackPlaylist: guideTrack.setGuideTrackPlaylist,
      seekGuideTrack: guideTrack.seekGuideTrack,
      startSession: sessionActions.startSession,
      attachSession: sessionActions.attachSession,
      stopSession: sessionActions.stopSession,
      playbackSession: sessionActions.playbackSession,
      seekPlaybackProgress: playbackControls.seekPlaybackProgress,
      seekPlaybackWindow: playbackControls.seekPlaybackWindow,
      pausePlayback: playbackControls.pausePlayback,
      resumePlayback: playbackControls.resumePlayback,
      stepPlaybackWindow: playbackControls.stepPlaybackWindow,
      audioContext: state.audioContext,
      resumeAudio: orchestration.resumeAudio,
      activeTemplate: state.activeTemplate,
      setActiveTemplate: guideTrack.setActiveTemplate,
      listenersRef: state.listenersRef,
      logger: mocks.logger,
    });

    expect(result.current).toEqual({
      marker: "context-value",
    });
  });
});
