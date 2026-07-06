import { describe, expect, it } from "vitest";

import { resolvePlaylistHarmonicLabel } from "../../src/utils/playlistTransitionKeyRuntime";
import type { LibraryTrack } from "../../src/types/library";

function createTrack(id: string, keySignature: string | null): LibraryTrack {
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
      bpm: 128,
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
      keySignature,
      energyLevel: 0.5,
      danceability: 0.5,
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
    title: id,
    sourcePath: `/tracks/${id}.wav`,
    storagePath: null,
    importedAt: "2026-01-01T00:00:00.000Z",
    bpm: 128,
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
    keySignature,
    energyLevel: 0.5,
    danceability: 0.5,
    structuralPatterns: [],
  };
}

describe("playlistTransitionKeyRuntime", () => {
  it("resolves same-key, relative, adjacent and open-key compatibility", () => {
    expect(
      resolvePlaylistHarmonicLabel(createTrack("a", "C major"), createTrack("b", "C major")),
    ).toEqual({ label: "Same key 8B", score: 3 });

    expect(
      resolvePlaylistHarmonicLabel(createTrack("a", "C major"), createTrack("b", "A minor")),
    ).toEqual({ label: "Relative 8A", score: 2 });

    expect(
      resolvePlaylistHarmonicLabel(createTrack("a", "C major"), createTrack("b", "G major")),
    ).toEqual({ label: "Adjacent 9B", score: 2 });

    expect(
      resolvePlaylistHarmonicLabel(createTrack("a", "???"), createTrack("b", "G major")),
    ).toEqual({ label: "Open key", score: 0 });
  });
});
