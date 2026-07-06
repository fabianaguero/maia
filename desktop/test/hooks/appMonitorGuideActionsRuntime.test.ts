import { describe, expect, it, vi } from "vitest";

import {
  applyLibraryArmState,
  applyMonitorGuideState,
  buildAppMonitorGuideActionRunners,
  performPlaylistArm,
  performSessionArm,
  performSessionGuidePrime,
  performTrackArm,
  syncLibraryMonitorGuide,
} from "../../src/hooks/appMonitorGuideActionsRuntime";

const appRuntimeMock = vi.hoisted(() => ({
  resolveLibraryMonitorGuideState: vi.fn(),
  resolvePlaylistArmState: vi.fn(),
  resolveSessionMonitorGuideState: vi.fn(),
  resolveTrackArmState: vi.fn(),
}));

vi.mock("../../src/appRuntime", () => appRuntimeMock);

describe("appMonitorGuideActionsRuntime", () => {
  it("applies and executes track/playlist/session guide operations", () => {
    const setSelectedPlaylistId = vi.fn();
    const setSelectedTrackId = vi.fn();
    const setGuideTrack = vi.fn();
    const setGuideTrackPlaylist = vi.fn();

    applyLibraryArmState(
      {
        selectedPlaylistId: "playlist-1",
        selectedTrackId: "track-1",
      },
      { setSelectedPlaylistId, setSelectedTrackId },
    );
    expect(setSelectedPlaylistId).toHaveBeenCalledWith("playlist-1");
    expect(setSelectedTrackId).toHaveBeenCalledWith("track-1");

    applyMonitorGuideState(
      {
        trackPath: null,
        playlistPaths: ["/music/a.wav", "/music/b.wav"],
      },
      { setGuideTrack, setGuideTrackPlaylist },
    );
    expect(setGuideTrackPlaylist).toHaveBeenCalledWith(["/music/a.wav", "/music/b.wav"]);

    appRuntimeMock.resolveTrackArmState.mockReturnValue({
      selectedPlaylistId: null,
      selectedTrackId: "track-4",
    });
    performTrackArm({
      trackId: "track-4",
      tracks: [],
      setSelectedPlaylistId,
      setSelectedTrackId,
    });

    appRuntimeMock.resolvePlaylistArmState.mockReturnValue({
      selectedPlaylistId: "playlist-9",
      selectedTrackId: "track-9",
    });
    performPlaylistArm({
      playlistId: "playlist-9",
      playlists: [],
      tracks: [],
      setSelectedPlaylistId,
      setSelectedTrackId,
    });

    appRuntimeMock.resolveLibraryMonitorGuideState.mockReturnValue({
      trackPath: "/music/current.wav",
      playlistPaths: null,
    });
    syncLibraryMonitorGuide({
      selectedPlaylist: null,
      selectedTrack: null,
      tracks: [],
      setGuideTrack,
      setGuideTrackPlaylist,
    });
    expect(setGuideTrack).toHaveBeenCalledWith("/music/current.wav");

    appRuntimeMock.resolveSessionMonitorGuideState.mockReturnValue({
      trackPath: null,
      playlistPaths: ["/music/session.wav"],
    });
    performSessionGuidePrime({
      draft: { playlistId: "playlist-9" },
      playlists: [],
      tracks: [],
      setGuideTrack,
      setGuideTrackPlaylist,
    });
    expect(setGuideTrackPlaylist).toHaveBeenCalledWith(["/music/session.wav"]);

    const armPlaylistBase = vi.fn();
    const armTrackBase = vi.fn();

    performSessionArm({
      draft: { playlistId: "playlist-9" },
      armPlaylistBase,
      armTrackBase,
      setSelectedPlaylistId,
      setSelectedTrackId,
    });
    performSessionArm({
      draft: { trackId: "track-4" },
      armPlaylistBase,
      armTrackBase,
      setSelectedPlaylistId,
      setSelectedTrackId,
    });
    performSessionArm({
      draft: undefined,
      armPlaylistBase,
      armTrackBase,
      setSelectedPlaylistId,
      setSelectedTrackId,
    });

    expect(armPlaylistBase).toHaveBeenCalledWith("playlist-9");
    expect(armTrackBase).toHaveBeenCalledWith("track-4");
    expect(setSelectedPlaylistId).toHaveBeenCalledWith(null);
    expect(setSelectedTrackId).toHaveBeenCalledWith(null);
  });

  it("builds executable guide action runners", () => {
    const calls: string[] = [];
    appRuntimeMock.resolveTrackArmState.mockReturnValue({
      selectedPlaylistId: null,
      selectedTrackId: "track-5",
    });
    appRuntimeMock.resolvePlaylistArmState.mockReturnValue({
      selectedPlaylistId: "playlist-2",
      selectedTrackId: "track-7",
    });
    appRuntimeMock.resolveSessionMonitorGuideState.mockReturnValue({
      trackPath: "/music/prime.wav",
      playlistPaths: null,
    });

    const runners = buildAppMonitorGuideActionRunners({
      buildTrackArmInput: (trackId) => ({
        trackId,
        tracks: [],
        setSelectedPlaylistId: (value) => calls.push(`playlist:${String(value)}`),
        setSelectedTrackId: (value) => calls.push(`track:${String(value)}`),
      }),
      buildPlaylistArmInput: (playlistId) => ({
        playlistId,
        playlists: [],
        tracks: [],
        setSelectedPlaylistId: (value) => calls.push(`playlist:${String(value)}`),
        setSelectedTrackId: (value) => calls.push(`track:${String(value)}`),
      }),
      buildSessionArmInput: (draft, armPlaylistBase, armTrackBase) => ({
        draft,
        armPlaylistBase,
        armTrackBase,
        setSelectedPlaylistId: (value) => calls.push(`playlist:${String(value)}`),
        setSelectedTrackId: (value) => calls.push(`track:${String(value)}`),
      }),
      buildSessionGuideInput: (draft) => ({
        draft,
        playlists: [],
        tracks: [],
        setGuideTrack: (value) => calls.push(`guide:${String(value)}`),
        setGuideTrackPlaylist: (value) => calls.push(`playlistGuide:${value.join(",")}`),
      }),
    });

    runners.armTrackBase("track-5");
    runners.armPlaylistBase("playlist-2");
    runners.armSessionMusicalBase({ trackId: "track-5" });
    runners.primeMonitorGuideTrack({ trackId: "track-5" });

    expect(calls).toContain("track:track-5");
    expect(calls).toContain("playlist:playlist-2");
    expect(calls).toContain("guide:/music/prime.wav");
  });
});
