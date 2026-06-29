import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAppMonitorActions } from "../../src/hooks/useAppMonitorActions";

const guideActionsMock = vi.hoisted(() => ({
  useAppMonitorGuideActions: vi.fn(),
}));

const sessionActionsMock = vi.hoisted(() => ({
  useAppMonitorSessionActions: vi.fn(),
}));

vi.mock("../../src/hooks/useAppMonitorGuideActions", () => guideActionsMock);
vi.mock("../../src/hooks/useAppMonitorSessionActions", () => sessionActionsMock);

function createInput() {
  return {
    t: {
      appShell: {
        replayUnavailableTitle: "Unavailable",
        replayUnavailableBody: "Missing repository",
      },
      session: {
        unnamedSession: "Unnamed",
      },
    },
    library: {
      tracks: [],
      playlists: [],
      selectedTrack: null,
      selectedPlaylist: null,
      setSelectedTrackId: vi.fn(),
      setSelectedPlaylistId: vi.fn(),
    },
    repositories: {
      repositories: [],
      setSelectedRepositoryId: vi.fn(),
    },
    sessions: {
      sessions: [],
      setSelectedSessionId: vi.fn(),
      createSession: vi.fn(),
      clearError: vi.fn(),
    },
    monitor: {
      session: null,
      isPlayback: false,
      setGuideTrack: vi.fn(),
      setGuideTrackPlaylist: vi.fn(),
      playbackSession: vi.fn(),
      pausePlayback: vi.fn(),
      seekPlaybackWindow: vi.fn(),
      startSession: vi.fn(),
    },
    notify: vi.fn(),
    setAnalysisMode: vi.fn(),
    setScreen: vi.fn(),
    setPillar: vi.fn(),
  };
}

describe("useAppMonitorActions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("composes guide and session actions with shared callbacks", () => {
    const input = createInput();
    const armSessionMusicalBase = vi.fn();
    const primeMonitorGuideTrack = vi.fn();
    const startReplaySession = vi.fn();
    const startLiveSession = vi.fn();
    const openMonitoredRepo = vi.fn();

    guideActionsMock.useAppMonitorGuideActions.mockReturnValue({
      armTrackBase: vi.fn(),
      armPlaylistBase: vi.fn(),
      armSessionMusicalBase,
      primeMonitorGuideTrack,
    });
    sessionActionsMock.useAppMonitorSessionActions.mockReturnValue({
      startReplaySession,
      startLiveSession,
      openMonitoredRepo,
    });

    const { result } = renderHook(() => useAppMonitorActions(input));

    expect(guideActionsMock.useAppMonitorGuideActions).toHaveBeenCalledWith(input);
    expect(sessionActionsMock.useAppMonitorSessionActions).toHaveBeenCalledWith({
      ...input,
      armSessionMusicalBase,
      primeMonitorGuideTrack,
    });
    expect(result.current).toEqual(
      expect.objectContaining({
        armSessionMusicalBase,
        primeMonitorGuideTrack,
        startReplaySession,
        startLiveSession,
        openMonitoredRepo,
      }),
    );
  });
});
