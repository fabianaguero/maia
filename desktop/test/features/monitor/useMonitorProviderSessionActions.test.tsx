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
    session: {
      sessionRef: { current: null },
      setSession: vi.fn(),
      setIsPlayback: vi.fn(),
      setIsPlaybackPaused: vi.fn(),
      setMetrics: vi.fn(),
      isPlayback: false,
    },
    live: {
      activeRef: { current: false },
      isPlaybackRef: { current: false },
      directCursorRef: { current: undefined as number | undefined },
      emptyWindowsRef: { current: 0 },
      pollTimerRef: { current: null as number | null },
    },
    audio: {
      currentSegmentRef: { current: null },
      audioContextRef: { current: null },
    },
    replay: {
      replayEventsRef: { current: [] },
      replayMetricsRef: { current: [] },
      replayIndexRef: { current: 0 },
      replayHydratingRef: { current: false },
      replayHydrationTokenRef: { current: 0 },
      playbackPausedRef: { current: false },
    },
    guideTrack: {
      guideTrackPathRef: { current: null as string | null },
      guideTrackQueueRef: { current: [] as string[] },
      guideTrackRef: { current: null },
      guideTrackLoadPromiseRef: { current: null as Promise<void> | null },
    },
    runtime: {
      stopPolling: vi.fn(),
      buildLiveStartInput: vi.fn(() => ({ marker: "live-start-input" }) as never),
      ensureProviderAudioContext: vi.fn(async () => ({ state: "running" }) as AudioContext),
      replayTick: vi.fn(),
      syncReplayTelemetry: vi.fn(),
      resetReplayTelemetry: vi.fn(),
    },
    api: {
      startStreamSession: vi.fn(),
      stopStreamSession: vi.fn(),
      listSessionEvents: vi.fn(),
      updatePersistedSessionStatus: vi.fn(async () => undefined),
      pollLogStream: vi.fn(),
    },
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
        sessionRef: input.session.sessionRef,
        replaceExistingSessionIfPresent: expect.any(Function),
        startLiveMonitorSession: expect.any(Function),
        liveStartInput: { marker: "live-start-input" },
        logger: input.logger,
      }),
    );
    expect(input.runtime.buildLiveStartInput).toHaveBeenCalledWith("session-start", true);

    const startArgs = startMonitorProviderSessionState.mock.calls[0]?.[0];
    expect(startArgs).toBeDefined();

    await startArgs.replaceExistingSessionIfPresent();
    expect(replaceExistingMonitorSessionIfPresent).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionRef: input.session.sessionRef,
        setSession: input.session.setSession,
        stopPolling: input.runtime.stopPolling,
        stopStreamSession: input.api.stopStreamSession,
      }),
    );

    resolveLiveMonitorPollMode.mockResolvedValue({
      pollMode: "session",
      sessionId: "resolved-session",
    });

    const resolvedPollMode = await startArgs.resolveLiveMonitorPollMode({
      sessionInput: {
        sessionId: "session-2",
        adapterKind: "file",
        source: "/logs/secondary.log",
      },
    });

    expect(resolveLiveMonitorPollMode).toHaveBeenCalledWith({
      sessionInput: {
        sessionId: "session-2",
        adapterKind: "file",
        source: "/logs/secondary.log",
      },
      startStreamSession: input.api.startStreamSession,
    });
    expect(resolvedPollMode).toEqual({
      pollMode: "session",
      sessionId: "resolved-session",
    });
  });

  it("delegates session attachment through the provider runtime", async () => {
    const input = createInput();
    const session = {
      sessionId: "session-attach-1",
      sourcePath: "/logs/visits-service.log",
      adapterKind: "file",
      status: "active",
    } as never;

    const { result } = renderHook(() => useMonitorProviderSessionActions(input));

    await act(async () => {
      await result.current.attachSession({
        session,
        repoId: "repo-1",
        repoTitle: "visits-service",
        trackId: "track-1",
        trackTitle: "Daft Punk",
        persistedSessionId: "persisted-attach-1",
      });
    });

    expect(attachMonitorProviderSessionState).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionRecord: session,
        repoId: "repo-1",
        repoTitle: "visits-service",
        trackId: "track-1",
        trackTitle: "Daft Punk",
        sourceTemplateId: null,
        persistedSessionId: "persisted-attach-1",
        sessionRef: input.session.sessionRef,
        replaceExistingSessionIfPresent: expect.any(Function),
        startLiveMonitorSession: expect.any(Function),
        liveStartInput: { marker: "live-start-input" },
        logger: input.logger,
      }),
    );
    expect(input.runtime.buildLiveStartInput).toHaveBeenCalledWith("attach-session", false);
  });

  it("delegates playback startup and wires replay helpers", async () => {
    const input = createInput();
    const guideTrackLoadPromise = Promise.resolve();
    input.guideTrack.guideTrackLoadPromiseRef.current = guideTrackLoadPromise;

    const { result } = renderHook(() => useMonitorProviderSessionActions(input));

    await act(async () => {
      await result.current.playbackSession({
        sessionId: "playback-1",
        label: "Replay session",
        sourcePath: "/logs/replay.log",
        repoId: "repo-2",
      });
    });

    expect(startMonitorProviderPlaybackSessionState).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "playback-1",
        label: "Replay session",
        sourcePath: "/logs/replay.log",
        repoId: "repo-2",
        sessionRef: input.session.sessionRef,
        stopPolling: input.runtime.stopPolling,
        loadSessionEvents: input.api.listSessionEvents,
        ensureAudioContext: input.runtime.ensureProviderAudioContext,
        setTimeoutFn: window.setTimeout,
        logger: input.logger,
      }),
    );

    const playbackArgs = startMonitorProviderPlaybackSessionState.mock.calls[0]?.[0];
    expect(playbackArgs).toEqual(
      expect.objectContaining({
        sessionId: "playback-1",
        label: "Replay session",
        sourcePath: "/logs/replay.log",
        repoId: "repo-2",
        sessionRef: input.session.sessionRef,
        activeRef: input.live.activeRef,
        replayEventsRef: input.replay.replayEventsRef,
        guideTrackLoadPromiseRef: input.guideTrack.guideTrackLoadPromiseRef,
        setTimeoutFn: window.setTimeout,
        logger: input.logger,
      }),
    );
    expect(typeof playbackArgs.awaitGuideTrack).toBe("function");
    expect(typeof playbackArgs.rebuildReplayEventsFromSource).toBe("function");
  });

  it("exposes direct replacement action for an existing session", async () => {
    const input = createInput();
    const { result } = renderHook(() => useMonitorProviderSessionActions(input));

    await act(async () => {
      await result.current.replaceExistingSessionIfPresent();
    });

    expect(replaceExistingMonitorSessionIfPresent).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionRef: input.session.sessionRef,
        setSession: input.session.setSession,
        stopPolling: input.runtime.stopPolling,
        stopStreamSession: input.api.stopStreamSession,
      }),
    );
  });

  it("stops the current session through the live lifecycle runtime", async () => {
    const input = createInput();
    input.session.sessionRef.current = {
      sessionId: "stream-1",
      persistedSessionId: "persisted-1",
      repoId: "repo-1",
      repoTitle: "visits-service",
      sourcePath: "/logs/visits-service.log",
      adapterKind: "file",
      pollMode: "session",
      startedAt: Date.now(),
    };
    input.session.isPlayback = true;

    const { result } = renderHook(() => useMonitorProviderSessionActions(input));

    await act(async () => {
      await result.current.stopSession();
    });

    expect(stopLiveMonitorSessionState).toHaveBeenCalledWith(
      expect.objectContaining({
        session: input.session.sessionRef.current,
        wasPlayback: true,
        stopPolling: input.runtime.stopPolling,
        sessionRef: input.session.sessionRef,
        resetReplayTelemetry: input.runtime.resetReplayTelemetry,
        stopStreamSession: input.api.stopStreamSession,
      }),
    );
  });
});
