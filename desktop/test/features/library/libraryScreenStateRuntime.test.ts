import { describe, expect, it } from "vitest";

import {
  buildLibraryPlaylistEditorOpenState,
  buildLibraryPlaylistEditorResetState,
  buildLibraryPlaylistEditorSyncState,
  buildLibraryPlaylistSaveInput,
  resolveLibraryLogConnectionError,
  resolveSelectedLibraryPlaylist,
  toggleLibraryPlaylistTrackId,
} from "../../../src/features/library/libraryScreenStateRuntime";
import type { BaseTrackPlaylist } from "../../../src/types/library";

function createPlaylist(overrides: Partial<BaseTrackPlaylist> = {}): BaseTrackPlaylist {
  return {
    id: "playlist-1",
    name: "Night shift",
    trackIds: ["track-1", "track-2"],
    createdAt: "2026-06-28T10:00:00.000Z",
    updatedAt: "2026-06-28T10:00:00.000Z",
    ...overrides,
  };
}

describe("libraryScreenStateRuntime", () => {
  it("builds open, reset and save states for the playlist editor", () => {
    const playlist = createPlaylist();

    expect(buildLibraryPlaylistEditorOpenState(playlist)).toEqual({
      playlistEditorOpen: true,
      playlistEditorId: "playlist-1",
      playlistName: "Night shift",
      playlistTrackIds: ["track-1", "track-2"],
    });
    expect(buildLibraryPlaylistEditorResetState()).toEqual({
      playlistEditorOpen: false,
      playlistEditorId: null,
      playlistName: "",
      playlistTrackIds: [],
    });
    expect(
      buildLibraryPlaylistSaveInput({
        playlistEditorId: "playlist-1",
        playlistName: "Night shift",
        playlistTrackIds: ["track-1"],
      }),
    ).toEqual({
      id: "playlist-1",
      name: "Night shift",
      trackIds: ["track-1"],
    });
  });

  it("toggles tracks and syncs the editor from the selected playlist", () => {
    const playlist = createPlaylist();
    const playlists = [playlist];

    expect(toggleLibraryPlaylistTrackId(["track-1"], "track-2")).toEqual(["track-1", "track-2"]);
    expect(toggleLibraryPlaylistTrackId(["track-1", "track-2"], "track-1")).toEqual(["track-2"]);
    expect(resolveSelectedLibraryPlaylist(playlists, "playlist-1")).toEqual(playlist);
    expect(resolveSelectedLibraryPlaylist(playlists, "missing")).toBeNull();

    expect(
      buildLibraryPlaylistEditorSyncState({
        playlistEditorOpen: true,
        playlistEditorId: "playlist-1",
        selectedPlaylist: playlist,
      }),
    ).toEqual({
      playlistEditorOpen: true,
      playlistEditorId: "playlist-1",
      playlistName: "Night shift",
      playlistTrackIds: ["track-1", "track-2"],
    });

    expect(
      buildLibraryPlaylistEditorSyncState({
        playlistEditorOpen: false,
        playlistEditorId: null,
        selectedPlaylist: null,
      }),
    ).toEqual(buildLibraryPlaylistEditorResetState());
  });

  it("normalizes log connection refresh errors", () => {
    expect(resolveLibraryLogConnectionError(new Error("boom"))).toBe("boom");
    expect(resolveLibraryLogConnectionError("plain")).toBe("plain");
  });
});
