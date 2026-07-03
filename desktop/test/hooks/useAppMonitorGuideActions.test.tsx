import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAppMonitorGuideActions } from "../../src/hooks/useAppMonitorGuideActions";

const appRuntimeMock = vi.hoisted(() => ({
  resolveLibraryMonitorGuideState: vi.fn(),
  resolvePlaylistArmState: vi.fn(),
  resolveSessionMonitorGuideState: vi.fn(),
  resolveTrackArmState: vi.fn(),
}));

vi.mock("../../src/appRuntime", () => appRuntimeMock);

function createInput() {
  return {
    library: {
      tracks: [] as never[],
      playlists: [] as never[],
      selectedTrack: null,
      selectedPlaylist: null,
      setSelectedTrackId: vi.fn(),
      setSelectedPlaylistId: vi.fn(),
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
  };
}

describe("useAppMonitorGuideActions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("syncs the live guide track from current library selection", () => {
    const input = createInput();
    appRuntimeMock.resolveLibraryMonitorGuideState.mockReturnValue({
      trackPath: "/music/current.wav",
      playlistPaths: null,
    });

    renderHook(() => useAppMonitorGuideActions(input));

    expect(appRuntimeMock.resolveLibraryMonitorGuideState).toHaveBeenCalled();
    expect(input.monitor.setGuideTrack).toHaveBeenCalledWith("/music/current.wav");
  });

  it("arms playlist and session guide state through the split runtime callbacks", () => {
    const input = createInput();
    appRuntimeMock.resolveLibraryMonitorGuideState.mockReturnValue({
      trackPath: null,
      playlistPaths: null,
    });
    appRuntimeMock.resolvePlaylistArmState.mockReturnValue({
      selectedPlaylistId: "playlist-1",
      selectedTrackId: "track-9",
    });
    appRuntimeMock.resolveSessionMonitorGuideState.mockReturnValue({
      trackPath: null,
      playlistPaths: ["/music/a.wav", "/music/b.wav"],
    });

    const { result } = renderHook(() => useAppMonitorGuideActions(input));

    act(() => {
      result.current.armPlaylistBase("playlist-1");
    });

    expect(input.library.setSelectedPlaylistId).toHaveBeenCalledWith("playlist-1");
    expect(input.library.setSelectedTrackId).toHaveBeenCalledWith("track-9");

    act(() => {
      result.current.primeMonitorGuideTrack({ playlistId: "playlist-1" });
    });

    expect(input.monitor.setGuideTrackPlaylist).toHaveBeenCalledWith([
      "/music/a.wav",
      "/music/b.wav",
    ]);
  });

  it("arms an individual track base and routes track-only session drafts through the same branch", () => {
    const input = createInput();
    appRuntimeMock.resolveLibraryMonitorGuideState.mockReturnValue({
      trackPath: null,
      playlistPaths: null,
    });
    appRuntimeMock.resolveTrackArmState.mockReturnValue({
      selectedPlaylistId: null,
      selectedTrackId: "track-4",
    });

    const { result } = renderHook(() => useAppMonitorGuideActions(input));

    act(() => {
      result.current.armTrackBase("track-4");
    });

    expect(input.library.setSelectedPlaylistId).toHaveBeenCalledWith(null);
    expect(input.library.setSelectedTrackId).toHaveBeenCalledWith("track-4");

    act(() => {
      result.current.armSessionMusicalBase({ trackId: "track-4" });
    });

    expect(appRuntimeMock.resolveTrackArmState).toHaveBeenNthCalledWith(2, "track-4", []);
  });

  it("routes playlist session drafts through playlist arming instead of clearing state", () => {
    const input = createInput();
    appRuntimeMock.resolveLibraryMonitorGuideState.mockReturnValue({
      trackPath: null,
      playlistPaths: null,
    });
    appRuntimeMock.resolvePlaylistArmState.mockReturnValue({
      selectedPlaylistId: "playlist-9",
      selectedTrackId: "track-2",
    });

    const { result } = renderHook(() => useAppMonitorGuideActions(input));

    act(() => {
      result.current.armSessionMusicalBase({ playlistId: "playlist-9" });
    });

    expect(appRuntimeMock.resolvePlaylistArmState).toHaveBeenCalledWith("playlist-9", [], []);
    expect(input.library.setSelectedPlaylistId).toHaveBeenCalledWith("playlist-9");
    expect(input.library.setSelectedTrackId).toHaveBeenCalledWith("track-2");
  });

  it("clears selected musical base when a session draft has no track or playlist", () => {
    const input = createInput();
    appRuntimeMock.resolveLibraryMonitorGuideState.mockReturnValue({
      trackPath: null,
      playlistPaths: null,
    });

    const { result } = renderHook(() => useAppMonitorGuideActions(input));

    act(() => {
      result.current.armSessionMusicalBase();
    });

    expect(input.library.setSelectedPlaylistId).toHaveBeenCalledWith(null);
    expect(input.library.setSelectedTrackId).toHaveBeenCalledWith(null);
  });
});
