import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildMonitorProviderControllerContextInput } from "../../../src/features/monitor/monitorProviderControllerContextRuntime";

const mocks = vi.hoisted(() => ({
  useMonitorProviderGuideTrackActions: vi.fn(),
  useMonitorProviderSessionOrchestration: vi.fn(),
  useMonitorProviderPlaybackControls: vi.fn(),
}));

vi.mock("../../../src/features/monitor/useMonitorProviderGuideTrackActions", async () => {
  const actual = await vi.importActual<
    typeof import("../../../src/features/monitor/useMonitorProviderGuideTrackActions")
  >("../../../src/features/monitor/useMonitorProviderGuideTrackActions");
  return {
    ...actual,
    useMonitorProviderGuideTrackActions: (...args: unknown[]) =>
      mocks.useMonitorProviderGuideTrackActions(...args),
  };
});

vi.mock("../../../src/features/monitor/useMonitorProviderSessionOrchestration", async () => {
  const actual = await vi.importActual<
    typeof import("../../../src/features/monitor/useMonitorProviderSessionOrchestration")
  >("../../../src/features/monitor/useMonitorProviderSessionOrchestration");
  return {
    ...actual,
    useMonitorProviderSessionOrchestration: (...args: unknown[]) =>
      mocks.useMonitorProviderSessionOrchestration(...args),
  };
});

vi.mock("../../../src/features/monitor/useMonitorProviderPlaybackControls", async () => {
  const actual = await vi.importActual<
    typeof import("../../../src/features/monitor/useMonitorProviderPlaybackControls")
  >("../../../src/features/monitor/useMonitorProviderPlaybackControls");
  return {
    ...actual,
    useMonitorProviderPlaybackControls: (...args: unknown[]) =>
      mocks.useMonitorProviderPlaybackControls(...args),
  };
});

import { useMonitorProviderControllerActions } from "../../../src/features/monitor/useMonitorProviderControllerActions";

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

describe("useMonitorProviderControllerActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMonitorProviderGuideTrackActions.mockReturnValue({
      setActiveTemplate: vi.fn(),
      seekGuideTrack: vi.fn(),
      setGuideTrack: vi.fn(),
      setGuideTrackPlaylist: vi.fn(),
      buildReloadPendingGuideTrack: vi.fn(() => vi.fn()),
    });
    mocks.useMonitorProviderSessionOrchestration.mockReturnValue({
      orchestration: {
        stopPolling: vi.fn(),
        resetReplayTelemetry: vi.fn(),
        syncReplayTelemetry: vi.fn(),
        dispatchReplayEventAtIndex: vi.fn(),
        replayTick: vi.fn(),
        resumeAudio: vi.fn(),
        ensureProviderAudioContext: vi.fn(),
        buildLiveStartInput: vi.fn(),
      },
      sessionActions: {
        startSession: vi.fn(),
        attachSession: vi.fn(),
        playbackSession: vi.fn(),
        stopSession: vi.fn(),
      },
    });
    mocks.useMonitorProviderPlaybackControls.mockReturnValue({
      seekPlaybackProgress: vi.fn(),
      seekPlaybackWindow: vi.fn(),
      pausePlayback: vi.fn(),
      resumePlayback: vi.fn(),
      stepPlaybackWindow: vi.fn(),
    });
  });

  it("composes provider sub-hooks into grouped action bundles", () => {
    const state = createState();
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };
    const resolveSourceTemplate = vi.fn((id: string) => ({ id, label: id }));
    const decodedAudioCache = new Map<
      string,
      Promise<{ samples: Float32Array; sampleRate: number; durationSec: number }>
    >();
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
      updatePersistedSessionCursor: vi.fn(),
      insertSessionEvent: vi.fn(),
      updatePersistedSessionStatus: vi.fn(),
    };

    const { result } = renderHook(() =>
      useMonitorProviderControllerActions({
        state,
        logger,
        resolveSourceTemplate,
        decodedAudioCache,
        transport,
        sessionApi,
        persistence,
      }),
    );

    expect(mocks.useMonitorProviderGuideTrackActions).toHaveBeenCalledWith(
      expect.objectContaining({
        state,
        resolveSourceTemplate,
        decodedAudioCache,
        logger,
      }),
    );
    expect(mocks.useMonitorProviderSessionOrchestration).toHaveBeenCalledWith(
      expect.objectContaining({
        state,
        logger,
        persistence,
        transport: expect.objectContaining({
          pollStreamSession: transport.pollStreamSession,
          pollLogStream: transport.pollLogStream,
          ingestStreamChunk: transport.ingestStreamChunk,
          fetchText: transport.fetchText,
        }),
        sessionApi: expect.objectContaining({
          startStreamSession: sessionApi.startStreamSession,
          stopStreamSession: sessionApi.stopStreamSession,
          listSessionEvents: sessionApi.listSessionEvents,
        }),
      }),
    );
    expect(mocks.useMonitorProviderPlaybackControls).toHaveBeenCalledWith(
      expect.objectContaining({
        isPlayback: state.isPlayback,
        replayEventsRef: state.replayEventsRef,
        pollTimerRef: state.pollTimerRef,
      }),
    );

    expect(result.current).toEqual({
      guideTrack: expect.objectContaining({
        setActiveTemplate: expect.any(Function),
        seekGuideTrack: expect.any(Function),
        setGuideTrack: expect.any(Function),
        setGuideTrackPlaylist: expect.any(Function),
      }),
      orchestration: {
        resumeAudio:
          mocks.useMonitorProviderSessionOrchestration.mock.results[0]?.value.orchestration
            .resumeAudio,
      },
      sessionActions:
        mocks.useMonitorProviderSessionOrchestration.mock.results[0]?.value.sessionActions,
      playbackControls: mocks.useMonitorProviderPlaybackControls.mock.results[0]?.value,
    });
  });

  it("builds context input from grouped controller actions", () => {
    const state = createState();
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };
    const guideTrack = {
      setActiveTemplate: vi.fn(),
      seekGuideTrack: vi.fn(),
      setGuideTrack: vi.fn(),
      setGuideTrackPlaylist: vi.fn(),
    };
    const orchestration = {
      resumeAudio: vi.fn(async () => ({ state: "running" }) as AudioContext),
    };
    const sessionActions = {
      startSession: vi.fn(),
      attachSession: vi.fn(),
      stopSession: vi.fn(),
      playbackSession: vi.fn(),
    };
    const playbackControls = {
      seekPlaybackProgress: vi.fn(),
      seekPlaybackWindow: vi.fn(),
      pausePlayback: vi.fn(),
      resumePlayback: vi.fn(),
      stepPlaybackWindow: vi.fn(),
    };

    expect(
      buildMonitorProviderControllerContextInput({
        state,
        logger,
        guideTrack,
        orchestration,
        sessionActions,
        playbackControls,
      }),
    ).toEqual(
      expect.objectContaining({
        session: state.session,
        metrics: state.metrics,
        setGuideTrack: guideTrack.setGuideTrack,
        startSession: sessionActions.startSession,
        pausePlayback: playbackControls.pausePlayback,
        resumeAudio: orchestration.resumeAudio,
        listenersRef: state.listenersRef,
        logger,
      }),
    );
  });
});
