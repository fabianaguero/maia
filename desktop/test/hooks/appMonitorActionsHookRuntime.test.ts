import { describe, expect, it, vi } from "vitest";

import {
  buildAppMonitorActionsResult,
  buildAppMonitorSessionHookInput,
} from "../../src/hooks/appMonitorActionsHookRuntime";

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

describe("appMonitorActionsHookRuntime", () => {
  it("builds the narrowed session-hook input from shared monitor actions", () => {
    const input = createInput();
    const armSessionMusicalBase = vi.fn();
    const primeMonitorGuideTrack = vi.fn();

    const result = buildAppMonitorSessionHookInput(input as never, {
      armSessionMusicalBase,
      primeMonitorGuideTrack,
    });

    expect(result.t).toBe(input.t);
    expect(result.armSessionMusicalBase).toBe(armSessionMusicalBase);
    expect(result.primeMonitorGuideTrack).toBe(primeMonitorGuideTrack);
  });

  it("returns a stable merged result contract", () => {
    const armTrackBase = vi.fn();
    const armPlaylistBase = vi.fn();
    const armSessionMusicalBase = vi.fn();
    const primeMonitorGuideTrack = vi.fn();
    const startReplaySession = vi.fn();
    const startLiveSession = vi.fn();
    const openMonitoredRepo = vi.fn();

    const result = buildAppMonitorActionsResult({
      guideActions: {
        armTrackBase,
        armPlaylistBase,
        armSessionMusicalBase,
        primeMonitorGuideTrack,
      },
      sessionActions: {
        startReplaySession,
        startLiveSession,
        openMonitoredRepo,
      },
    });

    expect(result).toMatchObject({
      armTrackBase,
      armPlaylistBase,
      armSessionMusicalBase,
      primeMonitorGuideTrack,
      startReplaySession,
      startLiveSession,
      openMonitoredRepo,
    });
  });
});
