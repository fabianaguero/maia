import { renderHook, waitFor } from "@testing-library/react";
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

function createHarness(initialTracks: LibraryTrack[] = [], initialPlaylists: BaseTrackPlaylist[] = []) {
  let trackState = [...initialTracks];
  let playlistState = [...initialPlaylists];
  let selectedTrackId: string | null = null;
  let mutatingState = false;
  let errorState: string | null = "stale";

  const setTracks = vi.fn((updater: ((current: LibraryTrack[]) => LibraryTrack[]) | LibraryTrack[]) => {
    trackState = typeof updater === "function" ? updater(trackState) : updater;
  });
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

    expect(libraryApiMock.pickTrackSourceDirectory).toHaveBeenCalledWith("/music/track-missing.wav");
    expect(harness.trackState[0]?.file.availabilityState).toBe("available");
    expect(harness.selectedTrackId).toBe("track-missing");
    expect(harness.errorState).toBeNull();
  });
});
