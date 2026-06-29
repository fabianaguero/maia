import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMonitorProviderSessionActions } from "../../../src/features/monitor/useMonitorProviderSessionActions";

const rebuildReplayEventsFromSource = vi.fn();
const resolveLiveMonitorPollMode = vi.fn();
const startLiveMonitorSessionState = vi.fn();
const stopLiveMonitorSessionState = vi.fn();
const startMonitorProviderSessionState = vi.fn();
const attachMonitorProviderSessionState = vi.fn();
const startMonitorProviderPlaybackSessionState = vi.fn();
const replaceExistingMonitorSessionIfPresent = vi.fn();

vi.mock("../../../src/features/monitor/monitorReplayRuntime", () => ({
  rebuildReplayEventsFromSource: (...args: unknown[]) => rebuildReplayEventsFromSource(...args),
}));

vi.mock("../../../src/features/monitor/monitorLiveLifecycleRuntime", () => ({
  resolveLiveMonitorPollMode: (...args: unknown[]) => resolveLiveMonitorPollMode(...args),
  startLiveMonitorSessionState: (...args: unknown[]) => startLiveMonitorSessionState(...args),
  stopLiveMonitorSessionState: (...args: unknown[]) => stopLiveMonitorSessionState(...args),
}));

vi.mock("../../../src/features/monitor/monitorProviderSessionRuntime", () => ({
  attachMonitorProviderSessionState: (...args: unknown[]) =>
    attachMonitorProviderSessionState(...args),
  startMonitorProviderSessionState: (...args: unknown[]) =>
    startMonitorProviderSessionState(...args),
}));

vi.mock("../../../src/features/monitor/monitorProviderPlaybackSessionRuntime", () => ({
  startMonitorProviderPlaybackSessionState: (...args: unknown[]) =>
    startMonitorProviderPlaybackSessionState(...args),
}));

vi.mock("../../../src/features/monitor/monitorProviderStartRuntime", async () => {
  const actual = await vi.importActual("../../../src/features/monitor/monitorProviderStartRuntime");

  return {
    ...actual,
    replaceExistingMonitorSessionIfPresent: (...args: unknown[]) =>
      replaceExistingMonitorSessionIfPresent(...args),
  };
});

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
}

describe("useMonitorProviderSessionActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    startMonitorProviderSessionState.mockResolvedValue(true);
    attachMonitorProviderSessionState.mockResolvedValue(true);
    startMonitorProviderPlaybackSessionState.mockResolvedValue(true);
    stopLiveMonitorSessionState.mockResolvedValue(undefined);
    rebuildReplayEventsFromSource.mockResolvedValue([]);
  });

  it("delegates live session start through the provider runtime", async () => {
    const input = createInput();
    const repo = {
      id: "repo-1",
      title: "visits-service",
    } as never;
    const sessionInput = {
      sessionId: "session-1",
      adapterKind: "file",
      source: "/logs/visits-service.log",
    } as const;

    const { result } = renderHook(() => useMonitorProviderSessionActions(input));

    await act(async () => {
      await result.current.startSession(repo, sessionInput, "persisted-1");
    });

    expect(startMonitorProviderSessionState).toHaveBeenCalledWith(
      expect.objectContaining({
        repo,
        sessionInput,
        persistedSessionId: "persisted-1",
        sessionRef: input.sessionRef,
        replaceExistingSessionIfPresent: expect.any(Function),
        startLiveMonitorSession: expect.any(Function),
        liveStartInput: { marker: "live-start-input" },
        logger: input.logger,
      }),
    );
    expect(input.buildLiveStartInput).toHaveBeenCalledWith("session-start", true);
  });

  it("stops the current session through the live lifecycle runtime", async () => {
    const input = createInput();
    input.sessionRef.current = {
      sessionId: "stream-1",
      persistedSessionId: "persisted-1",
      repoId: "repo-1",
      repoTitle: "visits-service",
      sourcePath: "/logs/visits-service.log",
      adapterKind: "file",
      pollMode: "session",
      startedAt: Date.now(),
    };
    input.isPlayback = true;

    const { result } = renderHook(() => useMonitorProviderSessionActions(input));

    await act(async () => {
      await result.current.stopSession();
    });

    expect(stopLiveMonitorSessionState).toHaveBeenCalledWith(
      expect.objectContaining({
        session: input.sessionRef.current,
        wasPlayback: true,
        stopPolling: input.stopPolling,
        sessionRef: input.sessionRef,
        resetReplayTelemetry: input.resetReplayTelemetry,
        stopStreamSession: input.stopStreamSession,
      }),
    );
  });
});
