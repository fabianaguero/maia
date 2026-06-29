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
});
