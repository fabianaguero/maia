import { describe, expect, it, vi } from "vitest";

import {
  applyLibraryArmState,
  applyMonitorGuideState,
  clearLibraryArmState,
} from "../../src/hooks/appMonitorGuideActionsRuntime";

describe("appMonitorGuideActionsRuntime", () => {
  it("applies and clears library arm state", () => {
    const setSelectedPlaylistId = vi.fn();
    const setSelectedTrackId = vi.fn();

    applyLibraryArmState(
      {
        selectedPlaylistId: "playlist-1",
        selectedTrackId: "track-1",
      },
      {
        setSelectedPlaylistId,
        setSelectedTrackId,
      },
    );

    clearLibraryArmState({
      setSelectedPlaylistId,
      setSelectedTrackId,
    });

    expect(setSelectedPlaylistId).toHaveBeenNthCalledWith(1, "playlist-1");
    expect(setSelectedTrackId).toHaveBeenNthCalledWith(1, "track-1");
    expect(setSelectedPlaylistId).toHaveBeenNthCalledWith(2, null);
    expect(setSelectedTrackId).toHaveBeenNthCalledWith(2, null);
  });

  it("applies track or playlist monitor guide state", () => {
    const setGuideTrack = vi.fn();
    const setGuideTrackPlaylist = vi.fn();

    applyMonitorGuideState(
      {
        trackPath: "/music/track.wav",
        playlistPaths: null,
      },
      {
        setGuideTrack,
        setGuideTrackPlaylist,
      },
    );

    applyMonitorGuideState(
      {
        trackPath: null,
        playlistPaths: ["/music/a.wav", "/music/b.wav"],
      },
      {
        setGuideTrack,
        setGuideTrackPlaylist,
      },
    );

    expect(setGuideTrack).toHaveBeenCalledWith("/music/track.wav");
    expect(setGuideTrackPlaylist).toHaveBeenCalledWith(["/music/a.wav", "/music/b.wav"]);
  });
});
