import { describe, expect, it, vi } from "vitest";

import {
  buildAppMonitorGuideActionInputs,
  buildAppMonitorLibraryGuideEffectInput,
  buildAppMonitorPlaylistArmInput,
  buildAppMonitorSessionArmInput,
  buildAppMonitorSessionGuideInput,
  buildAppMonitorTrackArmInput,
} from "../../src/hooks/appMonitorGuideActionsHookRuntime";

function createInput() {
  return {
    library: {
      tracks: [{ id: "track-1" }] as never[],
      playlists: [{ id: "playlist-1" }] as never[],
      selectedTrack: { id: "track-1" } as never,
      selectedPlaylist: { id: "playlist-1" } as never,
      setSelectedTrackId: vi.fn(),
      setSelectedPlaylistId: vi.fn(),
    },
    monitor: {
      setGuideTrack: vi.fn(),
      setGuideTrackPlaylist: vi.fn(),
    },
  };
}

describe("appMonitorGuideActionsHookRuntime", () => {
  it("builds track and playlist arm inputs from the shared guide slices", () => {
    const input = createInput();

    const trackArmInput = buildAppMonitorTrackArmInput(input as never, "track-1");
    const playlistArmInput = buildAppMonitorPlaylistArmInput(input as never, "playlist-1");

    expect(trackArmInput.trackId).toBe("track-1");
    expect(trackArmInput.tracks).toBe(input.library.tracks);
    expect(playlistArmInput.playlistId).toBe("playlist-1");
    expect(playlistArmInput.playlists).toBe(input.library.playlists);
  });

  it("builds guide-effect and session-guide inputs without exposing the whole hook payload", () => {
    const input = createInput();
    const guideInputs = buildAppMonitorGuideActionInputs(input as never);

    const libraryGuideInput = buildAppMonitorLibraryGuideEffectInput(input as never);
    const sessionGuideInput = buildAppMonitorSessionGuideInput(input as never, {
      playlistId: "playlist-1",
    });

    expect(guideInputs.trackArmInput.tracks).toBe(input.library.tracks);
    expect(guideInputs.libraryGuideEffectInput.selectedPlaylist).toBe(input.library.selectedPlaylist);
    expect(libraryGuideInput.selectedTrack).toBe(input.library.selectedTrack);
    expect(libraryGuideInput.setGuideTrack).toBe(input.monitor.setGuideTrack);
    expect(sessionGuideInput.draft?.playlistId).toBe("playlist-1");
    expect(sessionGuideInput.setGuideTrackPlaylist).toBe(input.monitor.setGuideTrackPlaylist);
  });

  it("builds the session arm input against the narrowed callbacks", () => {
    const input = createInput();
    const armPlaylistBase = vi.fn();
    const armTrackBase = vi.fn();

    const sessionArmInput = buildAppMonitorSessionArmInput(
      input as never,
      { trackId: "track-1" },
      armPlaylistBase,
      armTrackBase,
    );

    expect(sessionArmInput.draft?.trackId).toBe("track-1");
    expect(sessionArmInput.armPlaylistBase).toBe(armPlaylistBase);
    expect(sessionArmInput.armTrackBase).toBe(armTrackBase);
    expect(sessionArmInput.setSelectedTrackId).toBe(input.library.setSelectedTrackId);
  });
});
