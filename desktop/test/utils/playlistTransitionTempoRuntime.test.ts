import { describe, expect, it } from "vitest";

import { resolvePlaylistTempoRatio } from "../../src/utils/playlistTransitionTempoRuntime";
import type { LibraryTrack } from "../../src/types/library";

function createTrack(id: string, bpm: number | null, bpmLock = false): LibraryTrack {
  return {
    id,
    file: {
      sourcePath: `/tracks/${id}.wav`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1,
      modifiedAt: "2026-01-01T00:00:00.000Z",
      checksum: null,
      availabilityState: "available",
      playbackSource: "library",
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
      importedAt: "2026-01-01T00:00:00.000Z",
      bpm,
      bpmConfidence: 1,
      durationSeconds: 120,
      waveformBins: [],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "full",
      analyzerVersion: "test",
      analyzedAt: "2026-01-01T00:00:00.000Z",
      repoSuggestedBpm: null,
      repoSuggestedStatus: "none",
      notes: [],
      keySignature: "C major",
      energyLevel: 0.5,
      danceability: 0.5,
      structuralPatterns: [],
    },
    performance: {
      color: null,
      rating: 0,
      playCount: 0,
      lastPlayedAt: null,
      bpmLock,
      gridLock: false,
      mainCueSecond: null,
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
    },
    title: id,
    sourcePath: `/tracks/${id}.wav`,
    storagePath: null,
    importedAt: "2026-01-01T00:00:00.000Z",
    bpm,
    bpmConfidence: 1,
    durationSeconds: 120,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "none",
    notes: [],
    fileExtension: "wav",
    analysisMode: "full",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: "C major",
    energyLevel: 0.5,
    danceability: 0.5,
    structuralPatterns: [],
  };
}

describe("playlistTransitionTempoRuntime", () => {
  it("keeps neutral tempo for locked, invalid or far bpm values and adjusts near matches", () => {
    expect(resolvePlaylistTempoRatio(createTrack("a", 126), createTrack("b", 128))).toBe(0.98);
    expect(resolvePlaylistTempoRatio(createTrack("a", 96), createTrack("b", 134))).toBe(1);
    expect(resolvePlaylistTempoRatio(createTrack("a", 128), createTrack("b", 127.8))).toBe(1);
    expect(resolvePlaylistTempoRatio(createTrack("a", 128), createTrack("b", 128, true))).toBe(1);
    expect(resolvePlaylistTempoRatio(createTrack("a", null), createTrack("b", 128))).toBe(1);
  });
});
