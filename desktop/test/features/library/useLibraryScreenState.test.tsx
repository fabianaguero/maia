import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useLibraryScreenState } from "../../../src/features/library/useLibraryScreenState";
import type { BaseTrackPlaylist } from "../../../src/types/library";
import type { LogSourceConnection } from "../../../src/types/monitor";

const mockedRepositoriesApi = vi.hoisted(() => ({
  listLogSourceConnections: vi.fn(),
}));

vi.mock("../../../src/api/repositories", () => ({
  listLogSourceConnections: mockedRepositoriesApi.listLogSourceConnections,
}));

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

function createConnection(overrides: Partial<LogSourceConnection> = {}): LogSourceConnection {
  return {
    id: "conn-1",
    name: "services",
    adapterKind: "gcloud",
    source: "gcp-cloud-run://project/services",
    sourcePath: "gcp-cloud-run://project/services",
    config: {},
    enabled: true,
    createdAt: "2026-06-28T10:00:00.000Z",
    updatedAt: "2026-06-28T10:00:00.000Z",
    lastUsedAt: null,
    ...overrides,
  };
}

interface HookProps {
  activeTab?: "tracks" | "repositories" | "playlists" | "base-assets" | "connections";
  onSavePlaylist: (input: {
    id?: string;
    name: string;
    trackIds: string[];
  }) => Promise<boolean>;
  onSelectPlaylist: (playlistId: string) => void;
  onTabChange?: (tab: "tracks" | "repositories" | "playlists" | "base-assets" | "connections") => void;
  playlists: BaseTrackPlaylist[];
  selectedPlaylistId: string | null;
}

function renderLibraryScreenStateHook(initialProps: HookProps) {
  return renderHook((props: HookProps) => useLibraryScreenState(props), {
    initialProps,
  });
}

describe("useLibraryScreenState", () => {
  it("loads log connections on mount and resets form visibility on tab change", async () => {
    mockedRepositoriesApi.listLogSourceConnections.mockResolvedValue([createConnection()]);
    const onTabChange = vi.fn();
    const props: HookProps = {
      activeTab: "tracks",
      onSavePlaylist: vi.fn(async () => true),
      onSelectPlaylist: vi.fn(),
      onTabChange,
      playlists: [],
      selectedPlaylistId: null,
    };

    const { result } = renderLibraryScreenStateHook(props);

    await waitFor(() => {
      expect(result.current.logConnections).toHaveLength(1);
    });

    act(() => {
      result.current.setShowForm(true);
      result.current.handleTabChange("playlists");
    });

    expect(result.current.tab).toBe("playlists");
    expect(result.current.showForm).toBe(false);
    expect(onTabChange).toHaveBeenCalledWith("playlists");
  });

  it("surfaces connection refresh errors and clears them after a successful retry", async () => {
    mockedRepositoriesApi.listLogSourceConnections
      .mockRejectedValueOnce(new Error("gcloud timeout"))
      .mockResolvedValueOnce([createConnection({ id: "conn-2" })]);
    const props: HookProps = {
      onSavePlaylist: vi.fn(async () => true),
      onSelectPlaylist: vi.fn(),
      playlists: [],
      selectedPlaylistId: null,
    };

    const { result } = renderLibraryScreenStateHook(props);

    await waitFor(() => {
      expect(result.current.logConnectionError).toBe("gcloud timeout");
    });

    await act(async () => {
      await result.current.refreshLogConnections();
    });

    expect(result.current.logConnectionError).toBeNull();
    expect(result.current.logConnections.map((connection) => connection.id)).toEqual(["conn-2"]);
  });

  it("opens and syncs the playlist editor with the selected playlist", async () => {
    mockedRepositoriesApi.listLogSourceConnections.mockResolvedValue([]);
    const onSelectPlaylist = vi.fn();
    const playlist = createPlaylist();
    const onSavePlaylist = vi.fn(async () => true);

    const { result, rerender } = renderLibraryScreenStateHook({
      onSavePlaylist,
      onSelectPlaylist,
      playlists: [playlist],
      selectedPlaylistId: "playlist-1",
    });

    await waitFor(() => {
      expect(mockedRepositoriesApi.listLogSourceConnections).toHaveBeenCalled();
    });

    act(() => {
      result.current.openPlaylistEditor(playlist);
    });

    expect(result.current.playlistEditorOpen).toBe(true);
    expect(result.current.playlistEditorId).toBe("playlist-1");
    expect(result.current.playlistName).toBe("Night shift");
    expect(result.current.playlistTrackIds).toEqual(["track-1", "track-2"]);
    expect(onSelectPlaylist).toHaveBeenCalledWith("playlist-1");

    rerender({
      onSavePlaylist,
      onSelectPlaylist,
      playlists: [createPlaylist({ name: "Morning shift", trackIds: ["track-9"] })],
      selectedPlaylistId: "playlist-1",
    });

    await waitFor(() => {
      expect(result.current.playlistName).toBe("Morning shift");
    });

    expect(result.current.playlistTrackIds).toEqual(["track-9"]);
  });

  it("toggles playlist tracks and resets the editor after a successful save", async () => {
    mockedRepositoriesApi.listLogSourceConnections.mockResolvedValue([]);
    const onSavePlaylist = vi.fn(async () => true);
    const props: HookProps = {
      onSavePlaylist,
      onSelectPlaylist: vi.fn(),
      playlists: [],
      selectedPlaylistId: null,
    };

    const { result } = renderLibraryScreenStateHook(props);

    await waitFor(() => {
      expect(mockedRepositoriesApi.listLogSourceConnections).toHaveBeenCalled();
    });

    act(() => {
      result.current.openPlaylistEditor();
      result.current.setPlaylistName("Focus set");
      result.current.togglePlaylistTrack("track-1");
      result.current.togglePlaylistTrack("track-2");
      result.current.togglePlaylistTrack("track-1");
    });

    expect(result.current.playlistTrackIds).toEqual(["track-2"]);

    await act(async () => {
      await result.current.handleSavePlaylist();
    });

    expect(onSavePlaylist).toHaveBeenCalledWith({
      id: undefined,
      name: "Focus set",
      trackIds: ["track-2"],
    });
    expect(result.current.playlistEditorOpen).toBe(false);
    expect(result.current.playlistEditorId).toBeNull();
    expect(result.current.playlistName).toBe("");
    expect(result.current.playlistTrackIds).toEqual([]);
  });
});
