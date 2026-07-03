import { describe, expect, it, vi } from "vitest";

import { en } from "../../../../src/i18n/en";
import { buildTrackPerformancePanelViewModel } from "../../../../src/features/analyzer/components/trackPerformancePanelViewModelRuntime";
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
      beatGrid: [{ index: 0, second: 0 }],
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
      hotCues: [],
      memoryCues: [],
      savedLoops: [],
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
  };
}

describe("trackPerformancePanelViewModelRuntime", () => {
  it("builds summary, options, and quantized placement hint from the track state", () => {
    const viewModel = buildTrackPerformancePanelViewModel({
      track: createTrack(),
      busy: false,
      currentTime: 96.375,
      placementSecond: 96.375,
      onUpdatePerformance: vi.fn().mockResolvedValue(undefined),
      quantizeEnabled: true,
      t: en,
    });

    expect(viewModel.colorOptions.length).toBeGreaterThan(0);
    expect(viewModel.summaryMetrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "availability", value: "Available" }),
        expect.objectContaining({ key: "rating", value: "4/5" }),
      ]),
    );
    expect(viewModel.panelState.canEditPerformance).toBe(true);
    expect(viewModel.quantizeEnabledLabel).toBe("Quantize on");
    expect(typeof viewModel.quantizedPlacementHint).toBe("string");
  });
});
