import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePlaylistSources } from "../../../src/providers/hooks/usePlaylistSources";
import type {
  PlaylistMetadata,
  PlaylistSourceAuth,
} from "../../../src/providers/runtime/types";

function createSource(overrides: Partial<PlaylistSourceAuth> = {}): PlaylistSourceAuth {
  return {
    sourceType: "spotify",
    id: "spotify-source",
    displayName: "Spotify",
    isConnected: true,
    lastSyncedAt: null,
    oauthToken: "token-123",
    createdAt: "2026-06-28T00:00:00.000Z",
    updatedAt: "2026-06-28T00:00:00.000Z",
    ...overrides,
  };
}

function createPlaylist(overrides: Partial<PlaylistMetadata> = {}): PlaylistMetadata {
  return {
    id: "playlist-1",
    sourceType: "spotify",
    sourceId: "spotify-source",
    sourceName: "Spotify",
    name: "Night Drive",
    description: null,
    trackCount: 12,
    imageUrl: null,
    isPublic: false,
    externalUrl: null,
    syncedAt: "2026-06-28T00:00:00.000Z",
    ...overrides,
  };
}

describe("usePlaylistSources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("bootstraps sources from the injected loader and completes the loading cycle", async () => {
    const source = createSource();
    const dependencies = {
      loadSources: async () => [source],
    };
    const { result } = renderHook(() => usePlaylistSources(dependencies));

    expect(result.current.playlists).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sources).toEqual([source]);
  });

  it("surfaces bootstrap failures as unknown provider errors", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const dependencies = {
      loadSources: async () => {
        throw new Error("db offline");
      },
    };
    const { result } = renderHook(() => usePlaylistSources(dependencies));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result.current.error).toEqual({
      kind: "unknown",
      message: "Failed to load provider sources",
    });
  });

  it("surfaces not_found when syncing an unknown source and lets the caller clear the error", async () => {
    const { result } = renderHook(() => usePlaylistSources());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.syncSource("missing-source");
    });

    expect(result.current.error).toEqual({
      kind: "not_found",
      resourceId: "missing-source",
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("syncs a known source and returns its filtered playlists", async () => {
    const source = createSource();
    const syncedPlaylist = createPlaylist();
    const abortController = new AbortController();
    const syncSourcePlaylists = vi.fn().mockResolvedValue([syncedPlaylist]);
    const createAbortController = vi.fn(() => abortController);
    const dependencies = {
      loadSources: async () => [source],
      syncSourcePlaylists,
      createAbortController,
    };
    const { result } = renderHook(() => usePlaylistSources(dependencies));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.syncSource(source.id);
    });

    expect(createAbortController).toHaveBeenCalledTimes(1);
    expect(syncSourcePlaylists).toHaveBeenCalledWith({
      source,
      signal: abortController.signal,
    });
    expect(result.current.playlists).toEqual([syncedPlaylist]);

    await act(async () => {
      const playlists = await result.current.listPlaylistsForSource(source.id);
      expect(playlists).toEqual([syncedPlaylist]);
    });
  });

  it("supports local setup helpers and disconnect without introducing errors", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const { result } = renderHook(() => usePlaylistSources());

    await act(async () => {
      await result.current.initiateOAuth("spotify");
      await result.current.addLocalDirectory("/music/local");
      await result.current.disconnectSource("missing-source");
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("Initiating OAuth for spotify");
    expect(consoleLogSpy).toHaveBeenCalledWith("Adding local directory: /music/local");
    expect(result.current.sources).toEqual([]);
    expect(result.current.playlists).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("surfaces oauth, local-directory, and disconnect failures from injected actions", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const source = createSource();
    const playlist = createPlaylist();
    const dependencies = {
      loadSources: async () => [source],
      syncSourcePlaylists: async () => [playlist],
      initiateOAuthFlow: async () => {
        throw new Error("oauth down");
      },
      addLocalDirectoryEntry: async () => {
        throw new Error("fs denied");
      },
      disconnectSourceEntry: async () => {
        throw new Error("disconnect failed");
      },
    };
    const { result } = renderHook(() => usePlaylistSources(dependencies));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.syncSource(source.id);
    });

    await act(async () => {
      await result.current.initiateOAuth("soundcloud");
    });
    expect(result.current.error).toEqual({
      kind: "unknown",
      message: "Failed to authenticate with soundcloud",
    });

    await act(async () => {
      await result.current.addLocalDirectory("/music/local");
    });
    expect(result.current.error).toEqual({
      kind: "unknown",
      message: "Failed to add local directory",
    });

    await act(async () => {
      await result.current.disconnectSource(source.id);
    });
    expect(result.current.sources).toEqual([source]);
    expect(result.current.playlists).toEqual([playlist]);
    expect(result.current.error).toEqual({
      kind: "unknown",
      message: "Failed to disconnect source",
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("disconnects a synced source and clears its playlists", async () => {
    const source = createSource();
    const playlist = createPlaylist();
    const disconnectSourceEntry = vi.fn().mockResolvedValue(undefined);
    const dependencies = {
      loadSources: async () => [source],
      syncSourcePlaylists: async () => [playlist],
      disconnectSourceEntry,
    };
    const { result } = renderHook(() => usePlaylistSources(dependencies));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.syncSource(source.id);
    });

    await act(async () => {
      await result.current.disconnectSource(source.id);
    });

    expect(disconnectSourceEntry).toHaveBeenCalledWith(source.id);
    expect(result.current.sources).toEqual([]);
    expect(result.current.playlists).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("returns an empty list when filtering playlists for an unknown source", async () => {
    const { result } = renderHook(() => usePlaylistSources());

    await act(async () => {
      const playlists = await result.current.listPlaylistsForSource("spotify-source");
      expect(playlists).toEqual([]);
    });
  });
});
