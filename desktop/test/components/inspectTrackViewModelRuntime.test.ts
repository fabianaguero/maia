import { describe, expect, it } from "vitest";

import { en } from "../../src/i18n/en";
import { buildInspectTrackViewModel } from "../../src/features/inspect/inspectTrackViewModelRuntime";
import type { LibraryTrack } from "../../src/types/library";

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    file: {
      sourcePath: "/music/source.wav",
      storagePath: "/managed/source.wav",
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: 1234,
      modifiedAt: "2026-04-08T12:00:00.000Z",
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
      importedAt: "2026-04-08T12:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.82,
      durationSeconds: 240,
      waveformBins: [0.2, 0.4, 0.6],
      beatGrid: [
        { index: 0, second: 0 },
        { index: 1, second: 0.5 },
      ],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "librosa-dsp",
      analyzerVersion: "maia-analyzer",
      analyzedAt: "2026-04-08T12:00:00.000Z",
      repoSuggestedBpm: null,
      repoSuggestedStatus: "pending",
      notes: ["Detected stable groove"],
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
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
    },
    title: "Legacy Title",
    sourcePath: "/music/source.wav",
    storagePath: "/managed/source.wav",
    importedAt: "2026-04-08T12:00:00.000Z",
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
      hotCues: [],
    },
  };
}

describe("inspectTrackViewModelRuntime", () => {
  it("builds the inspect track deck view model from track state", () => {
    const viewModel = buildInspectTrackViewModel({
      track: createTrack(),
      trackMutating: false,
      t: en,
    });

    expect(viewModel.tabs).toHaveLength(4);
    expect(viewModel.summaryPills).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "status", value: "ready" })]),
    );
    expect(viewModel.metadataDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "analysis-mode", value: "Librosa Dsp" }),
      ]),
    );
    expect(viewModel.waveformModel.canEditBeatGrid).toBe(true);
    expect(viewModel.canSelectPhrase).toBe(true);
    expect(viewModel.resetKey).toContain("track-1");
  });
});
