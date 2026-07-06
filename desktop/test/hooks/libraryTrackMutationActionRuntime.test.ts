import { describe, expect, it, vi, beforeEach } from "vitest";

import type { LibraryTrack } from "../../src/types/library";
import {
  analyzeTrackInBackground,
  importLibraryTrackWithBackgroundAnalysis,
  reanalyzeLibraryTrack,
  relinkLibraryTrack,
  relinkMissingLibraryTracksFromDirectory,
} from "../../src/hooks/libraryTrackMutationActionRuntime";

const analyzerMock = vi.hoisted(() => ({
  runAnalyzerRequest: vi.fn(),
}));

const libraryApiMock = vi.hoisted(() => ({
  checkTrackExists: vi.fn(),
  importTrack: vi.fn(),
  pickTrackSourceDirectory: vi.fn(),
  pickTrackSourcePath: vi.fn(),
  resolveMissingTracksFromDirectory: vi.fn(),
  updateTrackSource: vi.fn(),
}));

vi.mock("../../src/api/analyzer", () => analyzerMock);
vi.mock("../../src/api/library", async () => {
  const actual = await vi.importActual<object>("../../src/api/library");
  return {
    ...actual,
    checkTrackExists: libraryApiMock.checkTrackExists,
    importTrack: libraryApiMock.importTrack,
    pickTrackSourceDirectory: libraryApiMock.pickTrackSourceDirectory,
    pickTrackSourcePath: libraryApiMock.pickTrackSourcePath,
    resolveMissingTracksFromDirectory: libraryApiMock.resolveMissingTracksFromDirectory,
    updateTrackSource: libraryApiMock.updateTrackSource,
  };
});

function createTrack(
  id: string,
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
    importedAt: "2026-06-29T10:00:00.000Z",
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
      modifiedAt: null,
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
      importedAt: "2026-06-29T10:00:00.000Z",
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

describe("libraryTrackMutationActionRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("analyzes/imports/reanalyzes/relinks through runtime helpers", async () => {
    const setTracks = vi.fn();
    const track = createTrack("track-a", {
      analyzerStatus: "pending",
      bpm: null,
      bpmConfidence: 0.1,
    });
    const analyzedTrack = createTrack("track-a", { bpm: 128, bpmConfidence: 0.9 });

    analyzerMock.runAnalyzerRequest.mockResolvedValue({
      status: "ok",
      payload: {
        musicalAsset: {
          artifacts: {
            waveformBins: [1, 2],
            beatGrid: [],
            bpmCurve: [{ second: 0, bpm: 128 }],
          },
          suggestedBpm: 128,
          confidence: 0.9,
        },
      },
    });
    libraryApiMock.importTrack.mockResolvedValue(track);
    libraryApiMock.checkTrackExists.mockResolvedValue(true);
    libraryApiMock.importTrack.mockResolvedValueOnce(track).mockResolvedValueOnce(analyzedTrack);
    libraryApiMock.pickTrackSourcePath.mockResolvedValue("/relinked/track-a.wav");
    libraryApiMock.updateTrackSource.mockResolvedValue(analyzedTrack);
    libraryApiMock.pickTrackSourceDirectory.mockResolvedValue("/music");
    libraryApiMock.resolveMissingTracksFromDirectory.mockResolvedValue({
      relinkedTracks: [analyzedTrack],
      unresolvedTrackIds: [],
    });

    await expect(analyzeTrackInBackground({ setTracks }, track)).resolves.toBeUndefined();
    await expect(
      importLibraryTrackWithBackgroundAnalysis({
        state: { setTracks },
        importInput: { title: "track-a", sourcePath: "/music/track-a.wav", musicStyleId: "house" },
      }),
    ).resolves.toEqual(track);
    await expect(reanalyzeLibraryTrack({ tracks: [track], trackId: "track-a" })).resolves.toEqual(
      analyzedTrack,
    );
    await expect(relinkLibraryTrack({ tracks: [track], trackId: "track-a" })).resolves.toEqual(
      analyzedTrack,
    );
    await expect(
      relinkMissingLibraryTracksFromDirectory({
        tracks: [createTrack("track-a", { availabilityState: "missing" })],
      }),
    ).resolves.toEqual({
      relinkedTracks: [analyzedTrack],
      unresolvedTrackIds: [],
    });

    expect(libraryApiMock.checkTrackExists).toHaveBeenCalledWith("/music/track-a.wav");
    expect(libraryApiMock.pickTrackSourcePath).toHaveBeenCalledWith("/music/track-a.wav");
    expect(libraryApiMock.updateTrackSource).toHaveBeenCalledWith("track-a", {
      sourcePath: "/relinked/track-a.wav",
    });
    expect(libraryApiMock.pickTrackSourceDirectory).toHaveBeenCalledWith("/music/track-a.wav");
  });
});
