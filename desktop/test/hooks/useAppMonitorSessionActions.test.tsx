import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAppMonitorSessionActions } from "../../src/hooks/useAppMonitorSessionActions";

const appRuntimeMock = vi.hoisted(() => ({
  resolveReplaySourceRepository: vi.fn(),
  shouldReuseActiveReplaySession: vi.fn(),
}));

const appMonitorActionsRuntimeMock = vi.hoisted(() => ({
  resolveMonitoredRepository: vi.fn(),
  resolveReplayMonitorDraft: vi.fn(),
  resolveSessionPersistenceAction: vi.fn(),
}));

const appContentRuntimeMock = vi.hoisted(() => ({
  resolveSessionRepository: vi.fn(),
}));

vi.mock("../../src/appRuntime", () => appRuntimeMock);
vi.mock("../../src/appMonitorActionsRuntime", () => appMonitorActionsRuntimeMock);
vi.mock("../../src/appContentRuntime", () => appContentRuntimeMock);

function createInput() {
  return {
    t: {
      appShell: {
        replayUnavailableTitle: "Replay unavailable",
        replayUnavailableBody: "Missing source",
      },
      session: {
        unnamedSession: "Unnamed session",
      },
    },
    repositories: {
      repositories: [{ id: "repo-1" }] as never[],
      setSelectedRepositoryId: vi.fn(),
    },
    sessions: {
      sessions: [],
      setSelectedSessionId: vi.fn(),
      createSession: vi.fn(async () => null),
      clearError: vi.fn(),
    },
    monitor: {
      session: null,
      isPlayback: false,
      setGuideTrack: vi.fn(),
      setGuideTrackPlaylist: vi.fn(),
      playbackSession: vi.fn(async () => true),
      pausePlayback: vi.fn(),
      seekPlaybackWindow: vi.fn(),
      startSession: vi.fn(async () => true),
    },
    notify: vi.fn(),
    setAnalysisMode: vi.fn(),
    setScreen: vi.fn(),
    setPillar: vi.fn(),
    armSessionMusicalBase: vi.fn(),
    primeMonitorGuideTrack: vi.fn(),
  };
}

describe("useAppMonitorSessionActions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts replay sessions, primes guide state and seeks when a window is provided", async () => {
    const input = createInput();
    const session = {
      id: "session-1",
      label: "Replay 1",
      sourcePath: "/logs/source.log",
      sourceId: "repo-1",
    };

    appMonitorActionsRuntimeMock.resolveReplayMonitorDraft.mockReturnValue({
      trackId: "track-1",
    });
    appRuntimeMock.resolveReplaySourceRepository.mockReturnValue({ id: "repo-1" });
    appRuntimeMock.shouldReuseActiveReplaySession.mockReturnValue(false);

    const { result } = renderHook(() => useAppMonitorSessionActions(input));

    await act(async () => {
      const ok = await result.current.startReplaySession(session as never, 4);
      expect(ok).toBe(true);
    });

    expect(input.sessions.setSelectedSessionId).toHaveBeenCalledWith("session-1");
    expect(input.armSessionMusicalBase).toHaveBeenCalledWith({ trackId: "track-1" });
    expect(input.primeMonitorGuideTrack).toHaveBeenCalledWith({ trackId: "track-1" });
    expect(input.monitor.playbackSession).toHaveBeenCalledWith({
      sessionId: "session-1",
      label: "Replay 1",
      sourcePath: "/logs/source.log",
      repoId: "repo-1",
    });
    expect(input.monitor.pausePlayback).toHaveBeenCalled();
    expect(input.monitor.seekPlaybackWindow).toHaveBeenCalledWith(4);
    expect(input.setScreen).toHaveBeenCalledWith("inspect");
  });

  it("creates persisted live sessions when monitor startup succeeds", async () => {
    const input = createInput();
    const resolvedRepository = { id: "repo-live" };
    appContentRuntimeMock.resolveSessionRepository.mockReturnValue(resolvedRepository);
    appMonitorActionsRuntimeMock.resolveSessionPersistenceAction.mockReturnValue("create");

    const { result } = renderHook(() => useAppMonitorSessionActions(input));

    await act(async () => {
      const ok = await result.current.startLiveSession(
        {
          adapterKind: "file",
          sessionId: "runtime-1",
          label: "Live session",
          source: { kind: "file", path: "/tmp/service.log" },
        } as never,
        "persisted-1",
        {
          sourceId: "repo-live",
          playlistId: "playlist-1",
        },
      );
      expect(ok).toBe(true);
    });

    expect(input.sessions.clearError).toHaveBeenCalled();
    expect(input.armSessionMusicalBase).toHaveBeenCalledWith({
      trackId: undefined,
      playlistId: "playlist-1",
    });
    expect(input.primeMonitorGuideTrack).toHaveBeenCalledWith({
      trackId: undefined,
      playlistId: "playlist-1",
    });
    expect(input.monitor.startSession).toHaveBeenCalledWith(
      resolvedRepository,
      expect.objectContaining({
        adapterKind: "file",
        sessionId: "runtime-1",
      }),
      "persisted-1",
    );
    expect(input.sessions.createSession).toHaveBeenCalledWith({
      id: "persisted-1",
      label: "Live session",
      sourceId: "repo-live",
      trackId: undefined,
      playlistId: "playlist-1",
      adapterKind: "file",
      mode: "live",
    });
  });

  it("fails replay startup when the source repository cannot be resolved", async () => {
    const input = createInput();
    appMonitorActionsRuntimeMock.resolveReplayMonitorDraft.mockReturnValue({
      trackId: "track-1",
    });
    appRuntimeMock.resolveReplaySourceRepository.mockReturnValue(null);

    const { result } = renderHook(() => useAppMonitorSessionActions(input));

    await act(async () => {
      const ok = await result.current.startReplaySession({
        id: "session-1",
      } as never);
      expect(ok).toBe(false);
    });

    expect(input.notify).toHaveBeenCalledWith("error", "Replay unavailable", "Missing source");
    expect(input.monitor.playbackSession).not.toHaveBeenCalled();
    expect(input.setScreen).not.toHaveBeenCalled();
  });

  it("reuses an already active replay session without replaying it again", async () => {
    const input = createInput();
    input.monitor.session = { persistedSessionId: "session-1" } as never;
    input.monitor.isPlayback = true;
    appMonitorActionsRuntimeMock.resolveReplayMonitorDraft.mockReturnValue({});
    appRuntimeMock.resolveReplaySourceRepository.mockReturnValue({ id: "repo-1" });
    appRuntimeMock.shouldReuseActiveReplaySession.mockReturnValue(true);

    const { result } = renderHook(() => useAppMonitorSessionActions(input));

    await act(async () => {
      const ok = await result.current.startReplaySession({
        id: "session-1",
        label: null,
        sourceId: "repo-1",
        sourcePath: "/logs/source.log",
      } as never);
      expect(ok).toBe(true);
    });

    expect(input.monitor.playbackSession).not.toHaveBeenCalled();
    expect(input.repositories.setSelectedRepositoryId).toHaveBeenCalledWith("repo-1");
    expect(input.setAnalysisMode).toHaveBeenCalledWith("repo");
    expect(input.setScreen).toHaveBeenCalledWith("inspect");
  });

  it("returns false when replay playback cannot be started", async () => {
    const input = createInput();
    input.monitor.playbackSession = vi.fn(async () => false);
    appMonitorActionsRuntimeMock.resolveReplayMonitorDraft.mockReturnValue({});
    appRuntimeMock.resolveReplaySourceRepository.mockReturnValue({ id: "repo-1" });
    appRuntimeMock.shouldReuseActiveReplaySession.mockReturnValue(false);

    const { result } = renderHook(() => useAppMonitorSessionActions(input));

    await act(async () => {
      const ok = await result.current.startReplaySession({
        id: "session-1",
        label: "Replay 1",
        sourceId: "repo-1",
        sourcePath: "/logs/source.log",
      } as never);
      expect(ok).toBe(false);
    });

    expect(input.monitor.pausePlayback).not.toHaveBeenCalled();
    expect(input.setScreen).not.toHaveBeenCalled();
  });

  it("returns false when live monitor startup fails", async () => {
    const input = createInput();
    input.monitor.startSession = vi.fn(async () => false);
    appContentRuntimeMock.resolveSessionRepository.mockReturnValue({ id: "repo-live" });

    const { result } = renderHook(() => useAppMonitorSessionActions(input));

    await act(async () => {
      const ok = await result.current.startLiveSession(
        {
          adapterKind: "file",
          sessionId: "runtime-1",
          source: { kind: "file", path: "/tmp/service.log" },
        } as never,
        "persisted-1",
      );
      expect(ok).toBe(false);
    });

    expect(input.sessions.createSession).not.toHaveBeenCalled();
    expect(input.sessions.setSelectedSessionId).not.toHaveBeenCalled();
  });

  it("selects an existing persisted live session instead of creating it again", async () => {
    const input = createInput();
    input.sessions.sessions = [{ id: "persisted-1" }] as never[];
    appContentRuntimeMock.resolveSessionRepository.mockReturnValue({ id: "repo-live" });
    appMonitorActionsRuntimeMock.resolveSessionPersistenceAction.mockReturnValue("select");

    const { result } = renderHook(() => useAppMonitorSessionActions(input));

    await act(async () => {
      const ok = await result.current.startLiveSession(
        {
          adapterKind: "file",
          sessionId: "runtime-1",
          label: "Live session",
          source: { kind: "file", path: "/tmp/service.log" },
        } as never,
        "persisted-1",
      );
      expect(ok).toBe(true);
    });

    expect(input.sessions.createSession).not.toHaveBeenCalled();
    expect(input.sessions.setSelectedSessionId).toHaveBeenCalledWith("persisted-1");
  });

  it("opens the monitored repository when the active session can be mapped", () => {
    const input = createInput();
    input.monitor.session = { repoId: "repo-1" } as never;
    appMonitorActionsRuntimeMock.resolveMonitoredRepository.mockReturnValue({ id: "repo-1" });

    const { result } = renderHook(() => useAppMonitorSessionActions(input));

    act(() => {
      result.current.openMonitoredRepo();
    });

    expect(input.repositories.setSelectedRepositoryId).toHaveBeenCalledWith("repo-1");
    expect(input.setAnalysisMode).toHaveBeenCalledWith("repo");
    expect(input.setScreen).toHaveBeenCalledWith("inspect");
    expect(input.setPillar).toHaveBeenCalledWith("curate");
  });

  it("ignores openMonitoredRepo when the current monitor session has no mapped repository", () => {
    const input = createInput();
    appMonitorActionsRuntimeMock.resolveMonitoredRepository.mockReturnValue(null);

    const { result } = renderHook(() => useAppMonitorSessionActions(input));

    act(() => {
      result.current.openMonitoredRepo();
    });

    expect(input.repositories.setSelectedRepositoryId).not.toHaveBeenCalled();
    expect(input.setAnalysisMode).not.toHaveBeenCalled();
    expect(input.setScreen).not.toHaveBeenCalled();
    expect(input.setPillar).not.toHaveBeenCalled();
  });
});
