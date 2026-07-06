import { describe, expect, it } from "vitest";

import { en } from "../../../../src/i18n/en";
import { buildTrackOriginalComparePanelViewModel } from "../../../../src/features/analyzer/components/trackOriginalComparePanelRuntime";
import type { LibraryTrack } from "../../../../src/types/library";

function createTrack(): LibraryTrack {
  const importedAt = "2026-04-08T12:00:00.000Z";

  return {
    id: "track-1",
    file: {
      sourcePath: "/music/source.wav",
      storagePath: "/managed/source.wav",
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: 1234,
      modifiedAt: importedAt,
      checksum: null,
      availabilityState: "available",
      playbackSource: "managed_snapshot",
    },
    tags: {
      title: "System Pulse",
      artist: "Maia",
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
      bpm: 126,
      bpmConfidence: 0.82,
      durationSeconds: 240,
      waveformBins: [0.2, 0.4],
      beatGrid: [
        { index: 0, second: 0 },
        { index: 1, second: 0.5 },
      ],
      bpmCurve: [{ second: 0, bpm: 126 }],
      analyzerStatus: "ready",
      analysisMode: "librosa-dsp",
      analyzerVersion: "maia-analyzer",
      analyzedAt: importedAt,
      repoSuggestedBpm: null,
      repoSuggestedStatus: "pending",
      notes: [],
      keySignature: null,
      energyLevel: null,
      danceability: null,
      structuralPatterns: [],
    },
    performance: {
      color: "#f59e0b",
      rating: 4,
      playCount: 7,
      lastPlayedAt: null,
      bpmLock: true,
      gridLock: false,
      mainCueSecond: 12.5,
      hotCues: [
        {
          id: "hot-1",
          slot: 1,
          second: 24.25,
          label: "Drop",
          kind: "hot",
          color: null,
        },
      ],
      memoryCues: [
        {
          id: "memory-1",
          slot: null,
          second: 48,
          label: "Breakdown",
          kind: "memory",
          color: null,
        },
      ],
      savedLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 64,
          endSecond: 72,
          label: "Loop A",
          color: null,
          locked: false,
        },
      ],
    },
    title: "Legacy Title",
    sourcePath: "/music/source.wav",
    storagePath: "/managed/source.wav",
    importedAt,
    bpm: 100,
    bpmConfidence: 0.1,
    durationSeconds: 100,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "pending",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "pending",
    notes: [],
    fileExtension: ".mp3",
    analysisMode: "legacy",
    musicStyleId: "legacy",
    musicStyleLabel: "Legacy",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
    visualization: {
      waveform: [],
      beatGrid: [],
      hotCues: [
        {
          second: 8,
          label: "Legacy intro",
          type: "legacy",
        },
      ],
    },
  };
}

describe("trackOriginalComparePanelRuntime", () => {
  it("builds compare metrics, audition points, and waveform sources", () => {
    const viewModel = buildTrackOriginalComparePanelViewModel({
      track: createTrack(),
      activeAuditionId: "altered",
      t: en,
    });

    expect(viewModel.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "original-cues", value: "1" }),
        expect.objectContaining({ key: "altered-cues", value: "3" }),
        expect.objectContaining({ key: "saved-loops", value: "1" }),
        expect.objectContaining({ key: "delta", value: "+2" }),
      ]),
    );
    expect(viewModel.auditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "altered", active: true }),
        expect.objectContaining({ id: "original", active: false }),
      ]),
    );
    expect(viewModel.originalCues).toHaveLength(1);
    expect(viewModel.alteredCues.length).toBeGreaterThan(viewModel.originalCues.length);
    expect(viewModel.alteredRegions).toHaveLength(1);
  });
});
