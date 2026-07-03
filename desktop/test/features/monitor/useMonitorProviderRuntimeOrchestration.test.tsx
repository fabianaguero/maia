import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMonitorProviderRuntimeOrchestration } from "../../../src/features/monitor/useMonitorProviderRuntimeOrchestration";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";

const emitMonitorProviderUpdateState = vi.fn();
const runMonitorProviderPollState = vi.fn();
const stopMonitorPollingState = vi.fn();
const scheduleMonitorPoll = vi.fn();
const dispatchReplayEventAtIndexState = vi.fn();
const runReplayTickState = vi.fn();
const resetReplayTelemetryState = vi.fn();
const syncReplayTelemetryState = vi.fn();
const syncGuideTrackCursorToReplayProgress = vi.fn();
const buildMonitorProviderLiveStartBaseInput = vi.fn();
const ensureMonitorAudioContext = vi.fn();
const emitMonitorAudioProbe = vi.fn();
const resumeMonitorAudioContextState = vi.fn();

vi.mock("../../../src/features/monitor/monitorProviderLiveRuntime", () => ({
  emitMonitorProviderUpdateState: (...args: unknown[]) => emitMonitorProviderUpdateState(...args),
  runMonitorProviderPollState: (...args: unknown[]) => runMonitorProviderPollState(...args),
}));

vi.mock("../../../src/features/monitor/monitorSessionRuntime", () => ({
  POLL_INTERVAL_MS: 600,
  scheduleMonitorPoll: (...args: unknown[]) => scheduleMonitorPoll(...args),
  stopMonitorPollingState: (...args: unknown[]) => stopMonitorPollingState(...args),
}));

vi.mock("../../../src/features/monitor/monitorPlaybackRuntime", () => ({
  dispatchReplayEventAtIndexState: (...args: unknown[]) => dispatchReplayEventAtIndexState(...args),
  runReplayTickState: (...args: unknown[]) => runReplayTickState(...args),
}));

vi.mock("../../../src/features/monitor/monitorReplayRuntime", () => ({
  resetReplayTelemetryState: (...args: unknown[]) => resetReplayTelemetryState(...args),
  syncReplayTelemetryState: (...args: unknown[]) => syncReplayTelemetryState(...args),
  syncGuideTrackCursorToReplayProgress: (...args: unknown[]) =>
    syncGuideTrackCursorToReplayProgress(...args),
}));

vi.mock("../../../src/features/monitor/monitorProviderStartRuntime", () => ({
  buildMonitorProviderLiveStartBaseInput: (...args: unknown[]) =>
    buildMonitorProviderLiveStartBaseInput(...args),
}));

vi.mock("../../../src/features/monitor/monitorContextRuntime", () => ({
  ensureMonitorAudioContext: (...args: unknown[]) => ensureMonitorAudioContext(...args),
  emitMonitorAudioProbe: (...args: unknown[]) => emitMonitorAudioProbe(...args),
  stopAllMonitorAudio: vi.fn(),
}));

vi.mock("../../../src/features/monitor/monitorLiveLifecycleRuntime", () => ({
  resumeMonitorAudioContextState: (...args: unknown[]) => resumeMonitorAudioContextState(...args),
}));

function createUpdate(): LiveLogStreamUpdate {
  return {
    summary: "window",
    dominantLevel: "info",
    confidence: 0.8,
    lineCount: 4,
    anomalyCount: 1,
    levelCounts: { info: 4 },
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: [],
    warnings: [],
    fromOffset: 0,
    toOffset: 64,
    suggestedBpm: 126,
  };
}

function createInput() {
  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    },
    session: {
      sessionRef: { current: null },
      setSession: vi.fn(),
      setIsPlayback: vi.fn(),
      setMetrics: vi.fn(),
    },
    audio: {
      audioContextRef: { current: null },
      setAudioContext: vi.fn(),
      guideTrackRef: { current: null },
      guideTrackCursorRef: { current: { current: 0 } },
      guideTrackFinishedRef: { current: false },
    },
    playback: {
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
    },
    live: {
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
    },
    template: {
      activeTemplateRef: { current: { id: "default" } as never },
      setActiveTemplateState: vi.fn(),
      buildReloadPendingGuideTrack: vi.fn((reason: string) => vi.fn(() => reason)),
    },
    transport: {
      pollStreamSession: vi.fn(),
      pollLogStream: vi.fn(),
      ingestStreamChunk: vi.fn(),
      fetchText: vi.fn(async () => ""),
    },
    persistence: {
      updatePersistedSessionCursor: vi.fn(async () => undefined),
      insertSessionEvent: vi.fn(async () => undefined),
      updatePersistedSessionStatus: vi.fn(async () => undefined),
    },
  };
}

describe("useMonitorProviderRuntimeOrchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildMonitorProviderLiveStartBaseInput.mockReturnValue({ marker: "live-start-base" });
    ensureMonitorAudioContext.mockResolvedValue({ state: "running" });
    runMonitorProviderPollState.mockImplementation(async (state) => {
      state.schedulePoll(state.doPoll);
    });
    scheduleMonitorPoll.mockImplementation(({ doPoll }) => {
      void doPoll;
    });
    dispatchReplayEventAtIndexState.mockImplementation((state) => {
      state.syncGuideTrackToReplayProgress(0.25);
      return true;
    });
    resumeMonitorAudioContextState.mockResolvedValue({ state: "running" });
  });

  it("builds live-start input from the shared monitor provider runtime", () => {
    const input = createInput();
    buildMonitorProviderLiveStartBaseInput.mockImplementationOnce((value) => value);
    const { result } = renderHook(() => useMonitorProviderRuntimeOrchestration(input));

    const liveStartInput = result.current.buildLiveStartInput("attach-session", false);

    expect(buildMonitorProviderLiveStartBaseInput).toHaveBeenCalledWith(
      expect.objectContaining({
        activeTemplateRef: input.template.activeTemplateRef,
        setActiveTemplateState: input.template.setActiveTemplateState,
        reloadPendingGuideTrack: expect.any(Function),
        doPoll: expect.any(Function),
      }),
    );
    expect(liveStartInput).toEqual(
      expect.objectContaining({
        activeTemplateRef: input.template.activeTemplateRef,
        setActiveTemplateState: input.template.setActiveTemplateState,
        reloadPendingGuideTrack: expect.any(Function),
        doPoll: expect.any(Function),
        emitProbe: undefined,
      }),
    );
    expect(input.template.buildReloadPendingGuideTrack).toHaveBeenCalledWith("attach-session");
  });

  it("routes manual audio resume through the lifecycle runtime", async () => {
    const input = createInput();
    const { result } = renderHook(() => useMonitorProviderRuntimeOrchestration(input));

    await act(async () => {
      await result.current.resumeAudio();
    });

    expect(resumeMonitorAudioContextState).toHaveBeenCalledWith(
      expect.objectContaining({
        ensureAudioContext: expect.any(Function),
        emitProbe: expect.any(Function),
        logger: input.logger,
      }),
    );
  });

  it("routes polling, replay telemetry and update emission through the shared runtimes", async () => {
    const input = createInput();
    const { result } = renderHook(() => useMonitorProviderRuntimeOrchestration(input));

    act(() => {
      result.current.stopPolling();
      result.current.resetReplayTelemetry();
      result.current.syncReplayTelemetry(3);
      result.current.emitUpdate(createUpdate(), {
        accumulateMetrics: true,
        persistPlaybackEvent: false,
      });
    });

    await act(async () => {
      await result.current.doPoll();
    });

    expect(stopMonitorPollingState).toHaveBeenCalledWith(
      expect.objectContaining({
        activeRef: input.live.activeRef,
        pollTimerRef: input.live.pollTimerRef,
        wsRef: input.live.wsRef,
        httpUrlRef: input.live.httpUrlRef,
      }),
    );
    expect(resetReplayTelemetryState).toHaveBeenCalledWith(
      expect.objectContaining({
        replayEventsRef: input.playback.replayEventsRef,
        replayMetricsRef: input.playback.replayMetricsRef,
        replayIndexRef: input.playback.replayIndexRef,
      }),
    );
    expect(syncReplayTelemetryState).toHaveBeenCalledWith(
      expect.objectContaining({
        processedEvents: 3,
        replayEventsRef: input.playback.replayEventsRef,
        replayMetricsRef: input.playback.replayMetricsRef,
      }),
    );
    expect(emitMonitorProviderUpdateState).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ summary: "window", toOffset: 64 }),
        listenersRef: input.live.listenersRef,
        sessionRef: input.session.sessionRef,
      }),
    );
    expect(runMonitorProviderPollState).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionRef: input.session.sessionRef,
        activeRef: input.live.activeRef,
        directCursorRef: input.live.directCursorRef,
        emitUpdate: expect.any(Function),
        schedulePoll: expect.any(Function),
        doPoll: expect.any(Function),
      }),
    );
  });

  it("exposes audio, replay and live-start callbacks with the expected runtime wiring", async () => {
    const input = createInput();
    buildMonitorProviderLiveStartBaseInput.mockImplementationOnce((value) => value);
    const { result } = renderHook(() => useMonitorProviderRuntimeOrchestration(input));

    await act(async () => {
      await result.current.ensureProviderAudioContext();
    });

    act(() => {
      result.current.dispatchReplayEventAtIndex(5, { syncGuideTrack: true });
      result.current.replayTick();
    });

    const liveStartInput = result.current.buildLiveStartInput("session-start", true);
    liveStartInput.emitProbe?.({ state: "running" } as AudioContext);
    await act(async () => {
      await liveStartInput.ensureAudioContext();
      await liveStartInput.doPoll();
    });

    expect(ensureMonitorAudioContext).toHaveBeenCalledWith(
      expect.objectContaining({
        audioContextRef: input.audio.audioContextRef,
        setAudioContext: input.audio.setAudioContext,
      }),
    );
    expect(dispatchReplayEventAtIndexState).toHaveBeenCalledWith(
      expect.objectContaining({
        eventIndex: 5,
        replayEventsRef: input.playback.replayEventsRef,
        replayIndexRef: input.playback.replayIndexRef,
        syncGuideTrack: true,
      }),
    );
    expect(runReplayTickState).toHaveBeenCalledWith(
      expect.objectContaining({
        activeRef: input.live.activeRef,
        playbackPausedRef: input.playback.playbackPausedRef,
        replayEventsRef: input.playback.replayEventsRef,
        replayIndexRef: input.playback.replayIndexRef,
        dispatchReplayEventAtIndex: expect.any(Function),
        replayTick: expect.any(Function),
      }),
    );
    expect(syncGuideTrackCursorToReplayProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        cursorRef: input.audio.guideTrackCursorRef,
        finishedRef: input.audio.guideTrackFinishedRef,
        progress: 0.25,
      }),
    );
    expect(scheduleMonitorPoll).toHaveBeenCalledWith(
      expect.objectContaining({
        activeRef: input.live.activeRef,
        pollTimerRef: input.live.pollTimerRef,
        intervalMs: 600,
        doPoll: expect.any(Function),
      }),
    );
    expect(input.template.buildReloadPendingGuideTrack).toHaveBeenCalledWith("session-start");
    expect(emitMonitorAudioProbe).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 528,
        attackGain: 0.12,
        releaseTimeSec: 0.25,
      }),
    );
    expect(runMonitorProviderPollState).toHaveBeenCalled();
  });
});
