import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildLibraryTracksViewModel,
  formatTrackDuration,
} from "../../../src/features/library/libraryTracksViewModel";
import type { LibraryTrack } from "../../../src/types/library";

function createTrack(input: {
  id: string;
  title: string;
  bpm?: number | null;
  durationSeconds?: number | null;
  availabilityState?: "available" | "missing";
}): LibraryTrack {
  const importedAt = "2026-06-26T10:00:00.000Z";
  const durationSeconds = input.durationSeconds === undefined ? 180 : input.durationSeconds;

  return {
    id: input.id,
    title: input.title,
    sourcePath: `/music/${input.id}.wav`,
    storagePath: null,
    importedAt,
    bpm: input.bpm ?? null,
    bpmConfidence: 0.7,
    durationSeconds,
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
      sourcePath: `/music/${input.id}.wav`,
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1024,
      modifiedAt: importedAt,
      checksum: null,
      availabilityState: input.availabilityState ?? "available",
      playbackSource: "source_file",
    },
    tags: {
      title: input.title,
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
      bpm: input.bpm ?? null,
      bpmConfidence: 0.7,
      durationSeconds,
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

describe("libraryTracksViewModel", () => {
  it("formats duration consistently", () => {
    expect(formatTrackDuration(185)).toBe("3m5s");
    expect(formatTrackDuration(null)).toBeNull();
    expect(formatTrackDuration(0)).toBeNull();
  });

  it("builds track cards with missing and analyze state", () => {
    const model = buildLibraryTracksViewModel({
      newlyImportedId: "track-b",
      selectedTrackId: "track-a",
      t: en,
      tracks: [
        createTrack({ id: "track-a", title: "Track A", bpm: 126, durationSeconds: 185 }),
        createTrack({
          id: "track-b",
          title: "Track B",
          bpm: null,
          durationSeconds: null,
          availabilityState: "missing",
        }),
      ],
    });

    expect(model).toEqual([
      expect.objectContaining({
        id: "track-a",
        isSelected: true,
        isNewlyImported: false,
        isMissing: false,
        shouldAnalyze: false,
        title: "Track A",
        meta: "126 BPM · 3m5s · House · wav",
        actionLabel: en.library.view,
      }),
      expect.objectContaining({
        id: "track-b",
        isSelected: false,
        isNewlyImported: true,
        isMissing: true,
        shouldAnalyze: true,
        title: "Track B",
        meta: `- · ${en.library.lost.toUpperCase()} · House · wav`,
        actionLabel: en.library.analyze,
      }),
    ]);
  });
});
