import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BpmPanel } from "../../src/features/analyzer/components/BpmPanel";
import type { LibraryTrack } from "../../src/types/library";

function createTrack(overrides: Partial<LibraryTrack> = {}): LibraryTrack {
  const importedAt = "2026-04-08T12:00:00.000Z";
  const sourcePath = "/music/system-pulse.wav";
  const storagePath = "/managed/tracks/system-pulse.wav";
  const beatGrid = [{ index: 0, second: 0.18 }];
  const structuralPatterns = [
    {
      type: "intro",
      start: 0,
      end: 24,
      confidence: 0.8,
      label: "Intro",
    },
    {
      type: "drop",
      start: 84,
      end: 110,
      confidence: 0.86,
      label: "Drop",
    },
  ];

  return {
    id: "track-1",
    file: {
      sourcePath,
      storagePath,
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: 1_024_000,
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
      bpm: 126.4,
      bpmConfidence: 0.83,
      durationSeconds: 245,
      waveformBins: [0.2, 0.4, 0.6],
      beatGrid,
      bpmCurve: [{ second: 0, bpm: 126.4 }],
      analyzerStatus: "ready",
      analysisMode: "librosa-dsp",
      analyzerVersion: "maia-analyzer",
      analyzedAt: importedAt,
      repoSuggestedBpm: 128,
      repoSuggestedStatus: "ready",
      notes: [],
      keySignature: "A minor",
      energyLevel: 0.74,
      danceability: 0.68,
      structuralPatterns,
    },
    performance: {
      color: "#f59e0b",
      rating: 4,
      playCount: 7,
      lastPlayedAt: importedAt,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: 0.18,
      hotCues: [
        {
          id: "hot-cue-1",
          slot: 1,
          second: 0,
          label: "Intro",
          kind: "hot",
          color: "#f59e0b",
        },
      ],
      memoryCues: [],
      savedLoops: [],
    },
    title: "System Pulse",
    sourcePath,
    storagePath,
    importedAt,
    bpm: 126.4,
    bpmConfidence: 0.83,
    durationSeconds: 245,
    waveformBins: [0.2, 0.4, 0.6],
    beatGrid,
    bpmCurve: [{ second: 0, bpm: 126.4 }],
    analyzerStatus: "ready",
    repoSuggestedBpm: 128,
    repoSuggestedStatus: "ready",
    notes: [],
    fileExtension: ".wav",
    analysisMode: "librosa-dsp",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: "A minor",
    energyLevel: 0.74,
    danceability: 0.68,
    structuralPatterns,
    ...overrides,
  };
}

describe("BpmPanel", () => {
  it("renders enriched analyzer metrics for a track", () => {
    render(<BpmPanel track={createTrack()} />);

    expect(screen.getByText("126")).toBeInTheDocument();
    expect(screen.getByText("83%")).toBeInTheDocument();
    expect(screen.getByText("4:05")).toBeInTheDocument();
    expect(screen.getByText(".wav")).toBeInTheDocument();
    expect(screen.getByText("House")).toBeInTheDocument();
    expect(screen.getByText("A minor")).toBeInTheDocument();
    expect(screen.getByText("74%")).toBeInTheDocument();
    expect(screen.getByText("68%")).toBeInTheDocument();
    expect(screen.getByText("Librosa DSP")).toBeInTheDocument();
    expect(screen.getByText("Managed snapshot")).toBeInTheDocument();
    expect(screen.getByText("Intro, Drop")).toBeInTheDocument();
  });

  it("shows pending and fallback labels when optional metrics are missing", () => {
    const base = createTrack();

    render(
      <BpmPanel
        track={{
          ...base,
          file: {
            ...base.file,
            storagePath: base.file.sourcePath,
          },
          analysis: {
            ...base.analysis,
            bpm: null,
            durationSeconds: null,
            analysisMode: "custom-mode",
            keySignature: null,
            energyLevel: null,
            danceability: null,
            structuralPatterns: [],
          },
          bpm: 142,
          durationSeconds: 321,
          storagePath: "/managed/outdated.wav",
          analysisMode: "legacy-mode",
          keySignature: "C major",
          energyLevel: 0.99,
          danceability: 0.99,
          structuralPatterns: base.structuralPatterns,
        }}
      />,
    );

    expect(screen.getAllByText("Pending").length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText("Custom Mode")).toBeInTheDocument();
    expect(screen.getByText("Legacy/original path")).toBeInTheDocument();
  });
});
