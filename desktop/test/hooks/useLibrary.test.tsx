import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  BaseTrackPlaylist,
  LibraryTrack,
  RelinkMissingTracksResult,
} from "../../src/types/library";
import { useLibrary } from "../../src/hooks/useLibrary";

const analyzerMock = vi.hoisted(() => ({
  runAnalyzerRequest: vi.fn(),
}));

const libraryApiMock = vi.hoisted(() => ({
  checkTrackExists: vi.fn(),
  deleteBaseTrackPlaylist: vi.fn(),
  deleteTrack: vi.fn(),
  importTrack: vi.fn(),
  listPlaylists: vi.fn(),
  listTracks: vi.fn(),
  pickTrackSourceDirectory: vi.fn(),
  pickTrackSourcePath: vi.fn(),
  resolveMissingTracksFromDirectory: vi.fn(),
  saveBaseTrackPlaylist: vi.fn(),
  seedDemoTracks: vi.fn(),
  updateTrackAnalysis: vi.fn(),
  updateTrackPerformance: vi.fn(),
  updateTrackSource: vi.fn(),
}));

vi.mock("../../src/api/analyzer", () => analyzerMock);
vi.mock("../../src/api/library", () => libraryApiMock);

function createTrack(
  id: string,
  importedAt: string,
  availabilityState: "available" | "missing" = "available",
): LibraryTrack {
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
      availabilityState,
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

function createPlaylist(id: string, updatedAt: string, trackIds = ["track-a"]): BaseTrackPlaylist {
  return {
    id,
    name: id,
    trackIds,
    createdAt: updatedAt,
    updatedAt,
  };
}

describe("useLibrary", () => {
  beforeEach(() => {
    libraryApiMock.listTracks.mockResolvedValue([]);
    libraryApiMock.listPlaylists.mockResolvedValue([]);
    libraryApiMock.importTrack.mockResolvedValue(
      createTrack("track-new", "2026-06-25T11:00:00.000Z"),
    );
    libraryApiMock.deleteTrack.mockResolvedValue(undefined);
    libraryApiMock.saveBaseTrackPlaylist.mockResolvedValue(
      createPlaylist("playlist-new", "2026-06-25T11:00:00.000Z"),
    );
    libraryApiMock.deleteBaseTrackPlaylist.mockResolvedValue(undefined);
    libraryApiMock.pickTrackSourcePath.mockResolvedValue("/music/relinked.wav");
    libraryApiMock.updateTrackSource.mockResolvedValue(
      createTrack("track-a", "2026-06-25T12:00:00.000Z"),
    );
    libraryApiMock.pickTrackSourceDirectory.mockResolvedValue("/music");
    libraryApiMock.resolveMissingTracksFromDirectory.mockResolvedValue({
      relinkedTracks: [createTrack("track-missing", "2026-06-25T12:00:00.000Z")],
      unresolvedTrackIds: [],
    } satisfies RelinkMissingTracksResult);
    libraryApiMock.seedDemoTracks.mockResolvedValue([
      createTrack("seed-track", "2026-06-25T12:00:00.000Z"),
    ]);
    libraryApiMock.checkTrackExists.mockResolvedValue(true);
    libraryApiMock.updateTrackPerformance.mockResolvedValue(
      createTrack("track-a", "2026-06-25T12:00:00.000Z"),
    );
    libraryApiMock.updateTrackAnalysis.mockResolvedValue(
      createTrack("track-a", "2026-06-25T12:00:00.000Z"),
    );
    analyzerMock.runAnalyzerRequest.mockResolvedValue({
      status: "ok",
      payload: {
        summary: "done",
        musicalAsset: {
          id: "asset-1",
          assetType: "track_analysis",
          title: "track-new",
          sourcePath: "/music/track-new.wav",
          suggestedBpm: 128,
          confidence: 0.8,
          tags: [],
          metrics: {},
          artifacts: {
            waveformBins: [1, 2],
            beatGrid: [],
            bpmCurve: [],
          },
          createdAt: "2026-06-25T11:30:00.000Z",
        },
      },
      warnings: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("bootstraps tracks and playlists with selected ids", async () => {
    libraryApiMock.listTracks.mockResolvedValue([
      createTrack("track-a", "2026-06-25T10:00:00.000Z"),
      createTrack("track-b", "2026-06-25T11:00:00.000Z"),
    ]);
    libraryApiMock.listPlaylists.mockResolvedValue([
      createPlaylist("playlist-a", "2026-06-25T10:00:00.000Z"),
      createPlaylist("playlist-b", "2026-06-25T11:00:00.000Z"),
    ]);

    const { result } = renderHook(() => useLibrary());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tracks.map((entry) => entry.id)).toEqual(["track-b", "track-a"]);
    expect(result.current.playlists.map((entry) => entry.id)).toEqual(["playlist-b", "playlist-a"]);
    expect(result.current.selectedTrackId).toBe("track-b");
    expect(result.current.selectedPlaylistId).toBe("playlist-b");
  });

  it("imports, saves playlists, deletes tracks and playlists", async () => {
    const { result } = renderHook(() => useLibrary());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.importLibraryTrack({
        title: "track-new",
        sourcePath: "/music/track-new.wav",
        musicStyleId: "house",
      });
    });

    expect(result.current.selectedTrackId).toBe("track-new");

    await act(async () => {
      await result.current.savePlaylist({
        name: "playlist-new",
        trackIds: ["track-new"],
      });
    });

    expect(result.current.selectedPlaylistId).toBe("playlist-new");

    await act(async () => {
      await result.current.deleteLibraryTrack("track-new");
      await result.current.deletePlaylist("playlist-new");
    });

    expect(result.current.tracks).toEqual([]);
    expect(result.current.playlists).toEqual([]);
    expect(result.current.selectedPlaylistId).toBeNull();
  });

  it("relinks, seeds, updates and surfaces reanalyze failures", async () => {
    libraryApiMock.listTracks.mockResolvedValue([
      createTrack("track-a", "2026-06-25T10:00:00.000Z"),
      createTrack("track-missing", "2026-06-25T09:00:00.000Z", "missing"),
    ]);

    const { result } = renderHook(() => useLibrary());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.relinkTrack("track-a");
      await result.current.relinkMissingTracksFromDirectory();
      await result.current.updateTrackPerformance("track-a", { rating: 5 });
      await result.current.updateTrackAnalysis("track-a", { bpm: 125 });
    });

    libraryApiMock.checkTrackExists.mockResolvedValue(false);

    await act(async () => {
      const value = await result.current.reanalyzeTrack("track-a");
      expect(value).toBeNull();
    });

    expect(result.current.error).toContain("Track file not found");

    await act(async () => {
      await result.current.seedLibrary();
    });

    expect(result.current.selectedTrackId).toBe("seed-track");
  });

  it("surfaces playlist save/delete failures without corrupting current library state", async () => {
    libraryApiMock.listPlaylists.mockResolvedValue([
      createPlaylist("playlist-a", "2026-06-25T10:00:00.000Z"),
    ]);
    libraryApiMock.saveBaseTrackPlaylist.mockRejectedValueOnce(new Error("save playlist boom"));
    libraryApiMock.deleteBaseTrackPlaylist.mockRejectedValueOnce("delete playlist boom");

    const { result } = renderHook(() => useLibrary());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.selectedPlaylistId).toBe("playlist-a");
    });

    await act(async () => {
      const saved = await result.current.savePlaylist({
        name: "playlist-new",
        trackIds: ["track-a"],
      });
      expect(saved).toBeNull();
    });

    expect(result.current.error).toBe("save playlist boom");
    expect(result.current.playlists.map((entry) => entry.id)).toEqual(["playlist-a"]);

    await act(async () => {
      const deleted = await result.current.deletePlaylist("playlist-a");
      expect(deleted).toBe(false);
    });

    expect(result.current.error).toBe("delete playlist boom");
    expect(result.current.playlists.map((entry) => entry.id)).toEqual(["playlist-a"]);
    expect(result.current.selectedPlaylistId).toBe("playlist-a");
  });
});
