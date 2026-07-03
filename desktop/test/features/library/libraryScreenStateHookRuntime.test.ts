import { describe, expect, it, vi } from "vitest";

import {
  buildLibraryScreenPlaylistSaveHookInput,
  buildLibraryScreenPlaylistSyncInput,
  buildLibraryScreenRefreshConnectionsInput,
  buildLibraryScreenStateHookResult,
  buildLibraryScreenTabChangeHookState,
} from "../../../src/features/library/libraryScreenStateHookRuntime";

describe("libraryScreenStateHookRuntime", () => {
  it("builds tab change and refresh inputs for the library state hook", () => {
    const tabChange = buildLibraryScreenTabChangeHookState({
      nextTab: "playlists",
      setTab: vi.fn(),
      onTabChange: vi.fn(),
      setShowForm: vi.fn(),
    });
    const refreshInput = buildLibraryScreenRefreshConnectionsInput({
      setLogConnectionError: vi.fn(),
      setLogConnections: vi.fn(),
      listLogSourceConnections: vi.fn(async () => []),
    });

    expect(tabChange.nextTab).toBe("playlists");
    expect(tabChange.setTab).toBeTypeOf("function");
    expect(refreshInput.listLogSourceConnections).toBeTypeOf("function");
  });

  it("builds playlist sync/save inputs and returns hook results unchanged", () => {
    const syncInput = buildLibraryScreenPlaylistSyncInput({
      playlistEditorOpen: true,
      playlistEditorId: "playlist-1",
      playlists: [{ id: "playlist-1" }] as never,
      selectedPlaylistId: "playlist-1",
    });
    const saveInput = buildLibraryScreenPlaylistSaveHookInput({
      onSavePlaylist: vi.fn(async () => true),
      playlistEditorId: "playlist-1",
      playlistName: "Night shift",
      playlistTrackIds: ["track-1"],
    });
    const result = buildLibraryScreenStateHookResult({
      tab: "tracks",
      playlistEditorOpen: true,
    });

    expect(syncInput.selectedPlaylistId).toBe("playlist-1");
    expect(saveInput.playlistSaveInput).toEqual({
      playlistEditorId: "playlist-1",
      playlistName: "Night shift",
      playlistTrackIds: ["track-1"],
    });
    expect(result).toEqual({
      tab: "tracks",
      playlistEditorOpen: true,
    });
  });
});
