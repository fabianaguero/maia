import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLibraryPlaylistMutationActions } from "../../src/hooks/useLibraryPlaylistMutationActions";
import type { BaseTrackPlaylist, SaveBaseTrackPlaylistInput } from "../../src/types/library";

const libraryApiMock = vi.hoisted(() => ({
  deleteBaseTrackPlaylist: vi.fn(),
  saveBaseTrackPlaylist: vi.fn(),
}));

vi.mock("../../src/api/library", () => libraryApiMock);

function createPlaylist(id: string, updatedAt: string): BaseTrackPlaylist {
  return {
    id,
    name: id,
    trackIds: [`${id}-track`],
    createdAt: updatedAt,
    updatedAt,
  };
}

describe("useLibraryPlaylistMutationActions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("saves playlists, sorts them by recency and selects the saved playlist", async () => {
    const setPlaylists = vi.fn();
    const setSelectedPlaylistId = vi.fn();
    const setMutating = vi.fn();
    const setError = vi.fn();
    const savedPlaylist = createPlaylist("playlist-new", "2026-06-30T12:00:00.000Z");

    libraryApiMock.saveBaseTrackPlaylist.mockResolvedValue(savedPlaylist);

    const { result } = renderHook(() =>
      useLibraryPlaylistMutationActions({
        setPlaylists,
        setSelectedPlaylistId,
        setMutating,
        setError,
      }),
    );

    const input: SaveBaseTrackPlaylistInput = {
      name: "playlist-new",
      trackIds: ["track-a"],
    };

    await act(async () => {
      await expect(result.current.savePlaylist(input)).resolves.toEqual(savedPlaylist);
    });

    expect(libraryApiMock.saveBaseTrackPlaylist).toHaveBeenCalledWith(input);
    expect(setMutating.mock.calls).toEqual([[true], [false]]);
    expect(setSelectedPlaylistId).toHaveBeenCalledWith("playlist-new");
    expect(setError).toHaveBeenCalledWith(null);

    const updatePlaylists = setPlaylists.mock.calls[0]?.[0] as
      | ((current: BaseTrackPlaylist[]) => BaseTrackPlaylist[])
      | undefined;
    expect(updatePlaylists).toBeTypeOf("function");
    expect(
      updatePlaylists?.([
        createPlaylist("playlist-old", "2026-06-30T10:00:00.000Z"),
        createPlaylist("playlist-new", "2026-06-29T10:00:00.000Z"),
      ]),
    ).toEqual([savedPlaylist, createPlaylist("playlist-old", "2026-06-30T10:00:00.000Z")]);
  });

  it("surfaces playlist save failures without mutating selection", async () => {
    const setPlaylists = vi.fn();
    const setSelectedPlaylistId = vi.fn();
    const setMutating = vi.fn();
    const setError = vi.fn();

    libraryApiMock.saveBaseTrackPlaylist.mockRejectedValue(new Error("save playlist failed"));

    const { result } = renderHook(() =>
      useLibraryPlaylistMutationActions({
        setPlaylists,
        setSelectedPlaylistId,
        setMutating,
        setError,
      }),
    );

    await act(async () => {
      await expect(
        result.current.savePlaylist({
          name: "playlist-new",
          trackIds: ["track-a"],
        }),
      ).resolves.toBeNull();
    });

    expect(setPlaylists).not.toHaveBeenCalled();
    expect(setSelectedPlaylistId).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith("save playlist failed");
    expect(setMutating.mock.calls).toEqual([[true], [false]]);
  });

  it("deletes playlists and clears selection only when removing the active playlist", async () => {
    const setPlaylists = vi.fn();
    const setSelectedPlaylistId = vi.fn();
    const setMutating = vi.fn();
    const setError = vi.fn();

    libraryApiMock.deleteBaseTrackPlaylist.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useLibraryPlaylistMutationActions({
        setPlaylists,
        setSelectedPlaylistId,
        setMutating,
        setError,
      }),
    );

    await act(async () => {
      await expect(result.current.deletePlaylist("playlist-a")).resolves.toBe(true);
    });

    expect(libraryApiMock.deleteBaseTrackPlaylist).toHaveBeenCalledWith("playlist-a");
    expect(setError).toHaveBeenCalledWith(null);

    const updatePlaylists = setPlaylists.mock.calls[0]?.[0] as
      | ((current: BaseTrackPlaylist[]) => BaseTrackPlaylist[])
      | undefined;
    expect(
      updatePlaylists?.([
        createPlaylist("playlist-a", "2026-06-30T10:00:00.000Z"),
        createPlaylist("playlist-b", "2026-06-30T09:00:00.000Z"),
      ]),
    ).toEqual([createPlaylist("playlist-b", "2026-06-30T09:00:00.000Z")]);

    const updateSelection = setSelectedPlaylistId.mock.calls[0]?.[0] as
      | ((current: string | null) => string | null)
      | undefined;
    expect(updateSelection?.("playlist-a")).toBeNull();
    expect(updateSelection?.("playlist-b")).toBe("playlist-b");
    expect(setMutating.mock.calls).toEqual([[true], [false]]);
  });

  it("surfaces playlist delete failures without clearing current state", async () => {
    const setPlaylists = vi.fn();
    const setSelectedPlaylistId = vi.fn();
    const setMutating = vi.fn();
    const setError = vi.fn();

    libraryApiMock.deleteBaseTrackPlaylist.mockRejectedValue("delete playlist failed");

    const { result } = renderHook(() =>
      useLibraryPlaylistMutationActions({
        setPlaylists,
        setSelectedPlaylistId,
        setMutating,
        setError,
      }),
    );

    await act(async () => {
      await expect(result.current.deletePlaylist("playlist-a")).resolves.toBe(false);
    });

    expect(setPlaylists).not.toHaveBeenCalled();
    expect(setSelectedPlaylistId).not.toHaveBeenCalled();
    expect(setError).toHaveBeenCalledWith("delete playlist failed");
    expect(setMutating.mock.calls).toEqual([[true], [false]]);
  });
});
