import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useLibraryBootstrap } from "../../src/hooks/useLibraryBootstrap";
import type { BaseTrackPlaylist, LibraryTrack } from "../../src/types/library";

const libraryApiMock = vi.hoisted(() => ({
  listPlaylists: vi.fn(),
  listTracks: vi.fn(),
}));

vi.mock("../../src/api/library", () => libraryApiMock);

function createTrack(id: string, importedAt: string): LibraryTrack {
  return {
    id,
    title: id,
    sourcePath: `/music/${id}.wav`,
    storagePath: null,
    importedAt,
    bpm: 120,
    bpmConfidence: 0.5,
    durationSeconds: 180,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "idle",
    notes: [],
    fileExtension: "wav",
    analysisMode: "track",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
    file: {
      sourcePath: `/music/${id}.wav`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1000,
      modifiedAt: importedAt,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: id,
      artist: null,
      album: null,
      genre: null,
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt,
      bpm: 120,
      bpmConfidence: 0.5,
      durationSeconds: 180,
      waveformBins: [],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "track",
      analyzerVersion: null,
      analyzedAt: null,
      repoSuggestedBpm: null,
      repoSuggestedStatus: "idle",
      notes: [],
      keySignature: null,
      energyLevel: null,
      danceability: null,
      structuralPatterns: [],
    },
    performance: {
      color: null,
      rating: 0,
      playCount: 0,
      lastPlayedAt: null,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
    },
  };
}

function createPlaylist(id: string, updatedAt: string): BaseTrackPlaylist {
  return {
    id,
    name: id,
    trackIds: [],
    createdAt: updatedAt,
    updatedAt,
  };
}

describe("useLibraryBootstrap", () => {
  it("hydrates sorted tracks and playlists and resolves selected ids", async () => {
    libraryApiMock.listTracks.mockResolvedValue([
      createTrack("track-a", "2026-06-25T10:00:00.000Z"),
      createTrack("track-b", "2026-06-25T11:00:00.000Z"),
    ]);
    libraryApiMock.listPlaylists.mockResolvedValue([
      createPlaylist("playlist-a", "2026-06-25T10:00:00.000Z"),
      createPlaylist("playlist-b", "2026-06-25T11:00:00.000Z"),
    ]);

    const setTracks = vi.fn();
    const setPlaylists = vi.fn();
    const setSelectedTrackId = vi.fn();
    const setSelectedPlaylistId = vi.fn();
    const setLoading = vi.fn();
    const setError = vi.fn();

    renderHook(() =>
      useLibraryBootstrap({
        setTracks,
        setPlaylists,
        setSelectedTrackId,
        setSelectedPlaylistId,
        setLoading,
        setError,
      }),
    );

    await waitFor(() => {
      expect(setTracks).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: "track-b" })]),
      );
    });

    expect(setTracks.mock.calls.at(-1)?.[0].map((entry: LibraryTrack) => entry.id)).toEqual([
      "track-b",
      "track-a",
    ]);
    expect(
      setPlaylists.mock.calls.at(-1)?.[0].map((entry: BaseTrackPlaylist) => entry.id),
    ).toEqual(["playlist-b", "playlist-a"]);
    expect(setSelectedTrackId).toHaveBeenCalledWith(expect.any(Function));
    expect(setSelectedPlaylistId).toHaveBeenCalledWith(expect.any(Function));
    const trackSelectionResolver = setSelectedTrackId.mock.calls.at(-1)?.[0] as (
      current: string | null,
    ) => string | null;
    const playlistSelectionResolver = setSelectedPlaylistId.mock.calls.at(-1)?.[0] as (
      current: string | null,
    ) => string | null;
    expect(trackSelectionResolver("track-a")).toBe("track-a");
    expect(trackSelectionResolver("missing")).toBe("track-b");
    expect(playlistSelectionResolver("playlist-a")).toBe("playlist-a");
    expect(playlistSelectionResolver("missing")).toBe("playlist-b");
    expect(setError).toHaveBeenCalledWith(null);
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it("normalizes bootstrap failures into a user-facing error", async () => {
    libraryApiMock.listTracks.mockRejectedValue(new Error("bootstrap failed"));
    libraryApiMock.listPlaylists.mockResolvedValue([]);

    const setTracks = vi.fn();
    const setPlaylists = vi.fn();
    const setSelectedTrackId = vi.fn();
    const setSelectedPlaylistId = vi.fn();
    const setLoading = vi.fn();
    const setError = vi.fn();

    renderHook(() =>
      useLibraryBootstrap({
        setTracks,
        setPlaylists,
        setSelectedTrackId,
        setSelectedPlaylistId,
        setLoading,
        setError,
      }),
    );

    await waitFor(() => {
      expect(setError).toHaveBeenCalledWith("bootstrap failed");
    });
    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setTracks).not.toHaveBeenCalled();
  });

  it("ignores late async updates after unmount", async () => {
    let resolveTracks: ((tracks: LibraryTrack[]) => void) | null = null;
    libraryApiMock.listTracks.mockImplementation(
      () =>
        new Promise<LibraryTrack[]>((resolve) => {
          resolveTracks = resolve;
        }),
    );
    libraryApiMock.listPlaylists.mockResolvedValue([]);

    const setTracks = vi.fn();
    const setPlaylists = vi.fn();
    const setSelectedTrackId = vi.fn();
    const setSelectedPlaylistId = vi.fn();
    const setLoading = vi.fn();
    const setError = vi.fn();

    const view = renderHook(() =>
      useLibraryBootstrap({
        setTracks,
        setPlaylists,
        setSelectedTrackId,
        setSelectedPlaylistId,
        setLoading,
        setError,
      }),
    );

    view.unmount();
    resolveTracks?.([createTrack("track-a", "2026-06-25T10:00:00.000Z")]);

    await Promise.resolve();

    expect(setTracks).not.toHaveBeenCalled();
    expect(setPlaylists).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });

  it("ignores late bootstrap failures after unmount", async () => {
    let rejectTracks: ((error: Error) => void) | null = null;
    libraryApiMock.listTracks.mockImplementation(
      () =>
        new Promise<LibraryTrack[]>((_, reject) => {
          rejectTracks = reject;
        }),
    );
    libraryApiMock.listPlaylists.mockResolvedValue([]);

    const setTracks = vi.fn();
    const setPlaylists = vi.fn();
    const setSelectedTrackId = vi.fn();
    const setSelectedPlaylistId = vi.fn();
    const setLoading = vi.fn();
    const setError = vi.fn();

    const view = renderHook(() =>
      useLibraryBootstrap({
        setTracks,
        setPlaylists,
        setSelectedTrackId,
        setSelectedPlaylistId,
        setLoading,
        setError,
      }),
    );

    view.unmount();
    rejectTracks?.(new Error("late bootstrap failure"));

    await Promise.resolve();

    expect(setTracks).not.toHaveBeenCalled();
    expect(setPlaylists).not.toHaveBeenCalled();
    expect(setError).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });
});
