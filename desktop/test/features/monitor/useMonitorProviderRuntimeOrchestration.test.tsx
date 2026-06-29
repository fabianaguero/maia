import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMonitorProviderRuntimeOrchestration } from "../../../src/features/monitor/useMonitorProviderRuntimeOrchestration";

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

function createInput() {
  return {
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
    setAudioContext: vi.fn(),
    setPlaybackProgress: vi.fn(),
    setIsPlaybackPaused: vi.fn(),
    setPlaybackEventIndex: vi.fn(),
    setPlaybackEventCount: vi.fn(),
    updatePersistedSessionCursor: vi.fn(async () => undefined),
    insertSessionEvent: vi.fn(async () => undefined),
    pollStreamSession: vi.fn(),
    pollLogStream: vi.fn(),
    ingestStreamChunk: vi.fn(),
    fetchText: vi.fn(async () => ""),
    updatePersistedSessionStatus: vi.fn(async () => undefined),
    audioContextRef: { current: null },
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
    replayEventsRef: { current: [] },
    replayMetricsRef: { current: [] },
    replayIndexRef: { current: 0 },
    replayHydratingRef: { current: false },
    replayHydrationTokenRef: { current: 0 },
    playbackPausedRef: { current: false },
    guideTrackRef: { current: null },
    guideTrackCursorRef: { current: { current: 0 } },
    guideTrackFinishedRef: { current: false },
    activeTemplateRef: { current: { id: "default" } as never },
    setActiveTemplateState: vi.fn(),
    currentSegmentRef: { current: null },
    buildReloadPendingGuideTrack: vi.fn((reason: string) => vi.fn(() => reason)),
  };
}

describe("useMonitorProviderRuntimeOrchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildMonitorProviderLiveStartBaseInput.mockReturnValue({ marker: "live-start-base" });
    ensureMonitorAudioContext.mockResolvedValue({ state: "running" });
    runMonitorProviderPollState.mockResolvedValue(undefined);
    resumeMonitorAudioContextState.mockResolvedValue({ state: "running" });
  });

  it("builds live-start input from the shared monitor provider runtime", () => {
    const input = createInput();
    const { result } = renderHook(() => useMonitorProviderRuntimeOrchestration(input));

    const liveStartInput = result.current.buildLiveStartInput("attach-session", false);

    expect(buildMonitorProviderLiveStartBaseInput).toHaveBeenCalledWith(
      expect.objectContaining({
        activeTemplateRef: input.activeTemplateRef,
        setActiveTemplateState: input.setActiveTemplateState,
        reloadPendingGuideTrack: expect.any(Function),
        doPoll: expect.any(Function),
      }),
    );
    expect(liveStartInput).toEqual({ marker: "live-start-base" });
    expect(input.buildReloadPendingGuideTrack).toHaveBeenCalledWith("attach-session");
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
});
