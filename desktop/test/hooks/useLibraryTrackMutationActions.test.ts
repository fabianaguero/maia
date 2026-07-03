import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import type { MusicalAsset } from "../../src/contracts";
import { useLibraryTrackMutationActions } from "../../src/hooks/useLibraryTrackMutationActions";
import type {
  BaseTrackPlaylist,
  ImportTrackInput,
  LibraryTrack,
  RelinkMissingTracksResult,
} from "../../src/types/library";

const analyzerMock = vi.hoisted(() => ({
  runAnalyzerRequest: vi.fn(),
}));

const libraryApiMock = vi.hoisted(() => ({
  checkTrackExists: vi.fn(),
  deleteTrack: vi.fn(),
  importTrack: vi.fn(),
  pickTrackSourceDirectory: vi.fn(),
  pickTrackSourcePath: vi.fn(),
  resolveMissingTracksFromDirectory: vi.fn(),
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
  options: {
    analyzerStatus?: "pending" | "ready";
    availabilityState?: "available" | "missing";
    bpm?: number | null;
    bpmConfidence?: number;
  } = {},
): LibraryTrack {
  const analyzerStatus = options.analyzerStatus ?? "ready";
  const availabilityState = options.availabilityState ?? "available";
  const bpm = options.bpm ?? 120;
  const bpmConfidence = options.bpmConfidence ?? 0.5;

  return {
    id,
    title: id,
    sourcePath: `/music/${id}.wav`,
    storagePath: null,
    importedAt,
    bpm,
    bpmConfidence,
    durationSeconds: 180,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus,
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
      bpm,
      bpmConfidence,
      durationSeconds: 180,
      waveformBins: [],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus,
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

function createAnalyzedAsset(trackId: string): MusicalAsset {
  return {
    id: `${trackId}-asset`,
    assetType: "track_analysis",
    title: trackId,
    sourcePath: `/music/${trackId}.wav`,
    suggestedBpm: 128,
    confidence: 0.82,
    tags: [],
    metrics: {},
    artifacts: {
      waveformBins: [1, 2, 3],
      beatGrid: [{ index: 0, second: 0 }],
      bpmCurve: [{ second: 0, bpm: 128 }],
    },
    createdAt: "2026-06-29T12:00:00.000Z",
  };
}

function createHarness(
  initialTracks: LibraryTrack[] = [],
  initialPlaylists: BaseTrackPlaylist[] = [],
) {
  let trackState = [...initialTracks];
  let playlistState = [...initialPlaylists];
  let selectedTrackId: string | null = null;
  let mutatingState = false;
  let errorState: string | null = "stale";

  const setTracks = vi.fn(
    (updater: ((current: LibraryTrack[]) => LibraryTrack[]) | LibraryTrack[]) => {
      trackState = typeof updater === "function" ? updater(trackState) : updater;
    },
  );
  const setPlaylists = vi.fn(
    (updater: ((current: BaseTrackPlaylist[]) => BaseTrackPlaylist[]) | BaseTrackPlaylist[]) => {
      playlistState = typeof updater === "function" ? updater(playlistState) : updater;
    },
  );
  const setSelectedTrackId = vi.fn(
    (updater: ((current: string | null) => string | null) | string | null) => {
      selectedTrackId = typeof updater === "function" ? updater(selectedTrackId) : updater;
    },
  );
  const setMutating = vi.fn((next: boolean) => {
    mutatingState = next;
  });
  const setError = vi.fn((next: string | null) => {
    errorState = next;
  });

  const { result } = renderHook(() =>
    useLibraryTrackMutationActions({
      tracks: initialTracks,
      setTracks,
      setPlaylists,
      setSelectedTrackId,
      setMutating,
      setError,
    }),
  );

  return {
    actions: result.current,
    get trackState() {
      return trackState;
    },
    get playlistState() {
      return playlistState;
    },
    get selectedTrackId() {
      return selectedTrackId;
    },
    get mutatingState() {
      return mutatingState;
    },
    get errorState() {
      return errorState;
    },
    setTracks,
    setPlaylists,
    setSelectedTrackId,
    setMutating,
    setError,
  };
}

describe("useLibraryTrackMutationActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("imports a track, clears stale errors, and applies background analysis metadata for pending tracks", async () => {
    const importedTrack = createTrack("track-new", "2026-06-29T11:00:00.000Z", {
      analyzerStatus: "pending",
      bpm: null,
      bpmConfidence: 0.12,
    });
    const analyzerInput: ImportTrackInput = {
      title: "track-new",
      sourcePath: "/music/track-new.wav",
      musicStyleId: "house",
    };

    libraryApiMock.importTrack.mockResolvedValue(importedTrack);
    analyzerMock.runAnalyzerRequest.mockResolvedValue({
      status: "ok",
      payload: {
        summary: "done",
        musicalAsset: createAnalyzedAsset("track-new"),
      },
      warnings: [],
    });

    const harness = createHarness();

    await expect(harness.actions.importLibraryTrack(analyzerInput)).resolves.toEqual(importedTrack);

    await waitFor(() => {
      expect(harness.trackState[0]?.analysis.bpm).toBe(128);
    });

    expect(harness.selectedTrackId).toBe("track-new");
    expect(harness.errorState).toBeNull();
    expect(harness.setMutating).toHaveBeenNthCalledWith(1, true);
    expect(harness.setMutating).toHaveBeenLastCalledWith(false);
    expect(analyzerMock.runAnalyzerRequest).toHaveBeenCalledTimes(1);
  });

  it("surfaces a file-missing error during reanalyze", async () => {
    const currentTrack = createTrack("track-a", "2026-06-29T10:00:00.000Z");
    libraryApiMock.checkTrackExists.mockResolvedValue(false);

    const harness = createHarness([currentTrack]);

    await expect(harness.actions.reanalyzeTrack("track-a")).resolves.toBeNull();

    expect(libraryApiMock.importTrack).not.toHaveBeenCalled();
    expect(harness.errorState).toBe("Track file not found: /music/track-a.wav");
    expect(harness.setMutating).toHaveBeenNthCalledWith(1, true);
    expect(harness.setMutating).toHaveBeenLastCalledWith(false);
  });

  it("relinks missing tracks from a picked directory and prefers the first relinked selection", async () => {
    const missingTrack = createTrack("track-missing", "2026-06-29T09:00:00.000Z", {
      availabilityState: "missing",
    });
    const restoredTrack = createTrack("track-missing", "2026-06-29T12:00:00.000Z");
    const relinkResult: RelinkMissingTracksResult = {
      relinkedTracks: [restoredTrack],
      unresolvedTrackIds: [],
    };

    libraryApiMock.pickTrackSourceDirectory.mockResolvedValue("/music");
    libraryApiMock.resolveMissingTracksFromDirectory.mockResolvedValue(relinkResult);

    const harness = createHarness([missingTrack]);

    await expect(harness.actions.relinkMissingTracksFromDirectory()).resolves.toEqual(relinkResult);

    expect(libraryApiMock.pickTrackSourceDirectory).toHaveBeenCalledWith(
      "/music/track-missing.wav",
    );
    expect(harness.trackState[0]?.file.availabilityState).toBe("available");
    expect(harness.selectedTrackId).toBe("track-missing");
    expect(harness.errorState).toBeNull();
  });

  it("replaces the track during reanalyze when the source still exists", async () => {
    const currentTrack = createTrack("track-a", "2026-06-29T10:00:00.000Z", {
      bpm: 120,
      bpmConfidence: 0.5,
    });
    const refreshedTrack = createTrack("track-a", "2026-06-29T10:00:00.000Z", {
      bpm: 132,
      bpmConfidence: 0.91,
    });

    libraryApiMock.checkTrackExists.mockResolvedValue(true);
    libraryApiMock.importTrack.mockResolvedValue(refreshedTrack);

    const harness = createHarness([currentTrack]);

    await expect(harness.actions.reanalyzeTrack("track-a")).resolves.toEqual(refreshedTrack);

    expect(harness.trackState[0]?.analysis.bpm).toBe(132);
    expect(harness.errorState).toBeNull();
  });

  it("returns null when reanalyze is requested for a missing track id", async () => {
    const harness = createHarness([]);

    await expect(harness.actions.reanalyzeTrack("missing-track")).resolves.toBeNull();

    expect(libraryApiMock.checkTrackExists).not.toHaveBeenCalled();
    expect(harness.errorState).toBe("Track not found");
  });

  it("swallows background analyzer failures without breaking the import mutation", async () => {
    const importedTrack = createTrack("track-new", "2026-06-29T11:00:00.000Z", {
      analyzerStatus: "pending",
      bpm: null,
      bpmConfidence: 0.12,
    });
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => undefined);

    libraryApiMock.importTrack.mockResolvedValue(importedTrack);
    analyzerMock.runAnalyzerRequest.mockRejectedValue(new Error("analyzer down"));

    const harness = createHarness();

    await expect(
      harness.actions.importLibraryTrack({
        title: "track-new",
        sourcePath: "/music/track-new.wav",
        musicStyleId: "house",
      }),
    ).resolves.toEqual(importedTrack);

    await waitFor(() => {
      expect(debugSpy).toHaveBeenCalledWith("Background analysis failed:", expect.any(Error));
    });

    expect(harness.selectedTrackId).toBe("track-new");
    expect(harness.errorState).toBeNull();

    debugSpy.mockRestore();
  });

  it("seeds, updates and deletes tracks through the shared mutation runtime", async () => {
    const seededTrack = createTrack("seed-a", "2026-06-29T09:00:00.000Z");
    const currentTrack = createTrack("track-a", "2026-06-29T10:00:00.000Z");
    const performanceUpdatedTrack = createTrack("track-a", "2026-06-29T10:00:00.000Z", {
      bpm: 124,
    });
    const analysisUpdatedTrack = createTrack("track-a", "2026-06-29T10:00:00.000Z", {
      bpm: 128,
    });

    libraryApiMock.seedDemoTracks.mockResolvedValue([seededTrack]);
    libraryApiMock.updateTrackPerformance.mockResolvedValue(performanceUpdatedTrack);
    libraryApiMock.updateTrackAnalysis.mockResolvedValue(analysisUpdatedTrack);
    libraryApiMock.deleteTrack.mockResolvedValue(undefined);

    const harness = createHarness(
      [currentTrack],
      [
        {
          id: "playlist-1",
          name: "Playlist 1",
          createdAt: "2026-06-29T08:00:00.000Z",
          updatedAt: "2026-06-29T08:00:00.000Z",
          trackIds: ["track-a"],
        },
      ],
    );

    await act(async () => {
      await expect(harness.actions.seedLibrary()).resolves.toBeUndefined();
    });
    expect(harness.trackState[0]?.id).toBe("seed-a");
    expect(harness.selectedTrackId).toBe("seed-a");

    await act(async () => {
      await expect(
        harness.actions.updateTrackPerformance("track-a", {
          color: "blue",
        }),
      ).resolves.toEqual(performanceUpdatedTrack);
    });
    expect(harness.errorState).toBeNull();

    await act(async () => {
      await expect(
        harness.actions.updateTrackAnalysis("track-a", {
          bpm: 128,
        }),
      ).resolves.toEqual(analysisUpdatedTrack);
    });

    await act(async () => {
      await expect(harness.actions.deleteLibraryTrack("track-a")).resolves.toBe(true);
    });
    expect(harness.trackState.some((track) => track.id === "track-a")).toBe(false);
    expect(harness.playlistState[0]?.trackIds).toEqual([]);
  });

  it("relinks a single track when a replacement path is picked", async () => {
    const currentTrack = createTrack("track-a", "2026-06-29T10:00:00.000Z", {
      availabilityState: "missing",
    });
    const relinkedTrack = createTrack("track-a", "2026-06-29T10:00:00.000Z");

    libraryApiMock.pickTrackSourcePath.mockResolvedValue("/relinked/track-a.wav");
    libraryApiMock.updateTrackSource.mockResolvedValue(relinkedTrack);

    const harness = createHarness([currentTrack]);

    await expect(harness.actions.relinkTrack("track-a")).resolves.toEqual(relinkedTrack);

    expect(libraryApiMock.updateTrackSource).toHaveBeenCalledWith("track-a", {
      sourcePath: "/relinked/track-a.wav",
    });
    expect(harness.trackState[0]?.file.availabilityState).toBe("available");
  });

  it("skips relink mutations cleanly when the picker is cancelled or no directory is chosen", async () => {
    const currentTrack = createTrack("track-a", "2026-06-29T10:00:00.000Z", {
      availabilityState: "missing",
    });

    libraryApiMock.pickTrackSourcePath.mockResolvedValue(null);
    libraryApiMock.pickTrackSourceDirectory.mockResolvedValue(null);

    const harness = createHarness([currentTrack]);

    await expect(harness.actions.relinkTrack("track-a")).resolves.toBeNull();
    await expect(harness.actions.relinkMissingTracksFromDirectory()).resolves.toBeNull();

    expect(libraryApiMock.updateTrackSource).not.toHaveBeenCalled();
    expect(libraryApiMock.resolveMissingTracksFromDirectory).not.toHaveBeenCalled();
    expect(harness.errorState).toBeNull();
  });

  it("returns null when relink is requested for a missing track id", async () => {
    const harness = createHarness([]);

    await expect(harness.actions.relinkTrack("missing-track")).resolves.toBeNull();

    expect(libraryApiMock.pickTrackSourcePath).not.toHaveBeenCalled();
    expect(harness.errorState).toBe("Track not found");
  });
});
