import { describe, expect, it } from "vitest";

import {
  buildInspectTrackMetadataDetails,
  buildInspectTrackSummaryPills,
  buildInspectTrackTabViewModel,
  formatInspectTrackAnalysisMode,
} from "../../src/features/inspect/inspectTrackViewRuntime";
import { en } from "../../src/i18n/en";
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
      beatGrid: [],
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

describe("inspectTrackViewRuntime", () => {
  it("formats analysis mode labels for the metadata panel", () => {
    expect(formatInspectTrackAnalysisMode("librosa-dsp")).toBe("Librosa Dsp");
    expect(formatInspectTrackAnalysisMode("manual-grid")).toBe("Manual Grid");
  });

  it("builds the inspect tab model in display order", () => {
    expect(buildInspectTrackTabViewModel(en)).toEqual([
      {
        id: "overview",
        label: en.inspect.overview,
        panelId: "tab-overview",
      },
      {
        id: "grid",
        label: en.inspect.beatGrid,
        panelId: "tab-grid",
      },
      {
        id: "performance",
        label: en.inspect.performance,
        panelId: "tab-performance",
      },
      {
        id: "metadata",
        label: en.inspect.details,
        panelId: "tab-metadata",
      },
    ]);
  });

  it("builds summary pills and metadata rows for the inspect shell", () => {
    const track = createTrack();

    expect(buildInspectTrackSummaryPills(track, en)).toEqual([
      {
        key: "status",
        label: en.inspect.status,
        value: "ready",
      },
      {
        key: "style",
        label: en.inspect.style,
        value: "House",
      },
      {
        key: "imported",
        label: en.inspect.imported,
        value: "Apr 8, 2026",
      },
    ]);

    expect(buildInspectTrackMetadataDetails(track, en)).toEqual([
      {
        key: "analysis-mode",
        label: en.inspect.analysisMode,
        value: "Librosa Dsp",
      },
      {
        key: "source-path",
        label: en.inspect.sourcePath,
        value: "/music/source.wav",
      },
      {
        key: "storage-path",
        label: en.inspect.storagePath,
        value: "/managed/source.wav",
      },
    ]);
  });
});
