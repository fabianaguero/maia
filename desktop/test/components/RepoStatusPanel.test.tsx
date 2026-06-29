import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RepoStatusPanel } from "../../src/features/analyzer/components/RepoStatusPanel";
import type { LibraryTrack } from "../../src/types/library";

function createTrack(overrides: Partial<LibraryTrack> = {}): LibraryTrack {
  const importedAt = "2026-06-28T20:00:00.000Z";
  const sourcePath = "/music/system-pulse.wav";
  const storagePath = "/managed/tracks/system-pulse.wav";
  const beatGrid = [{ index: 0, second: 0.18 }];

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
      structuralPatterns: [],
    },
    performance: {
      color: "#f59e0b",
      rating: 4,
      playCount: 7,
      lastPlayedAt: importedAt,
      bpmLock: false,
      gridLock: false,
      mainCueSecond: 0.18,
      hotCues: [],
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
    structuralPatterns: [],
    ...overrides,
  };
}

describe("RepoStatusPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders analyzer repo suggestion status and bridge label", () => {
    render(<RepoStatusPanel track={createTrack()} analyzerLabel="Python analyzer" />);

    expect(screen.getByText("Repo-suggested BPM")).toBeInTheDocument();
    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("Python analyzer")).toBeInTheDocument();
  });

  it("falls back to pending when no repo BPM suggestion exists", () => {
    render(
      <RepoStatusPanel
        track={createTrack({
          analysis: {
            ...createTrack().analysis,
            repoSuggestedBpm: null,
            repoSuggestedStatus: "waiting",
          },
        })}
        analyzerLabel="Offline analyzer"
      />,
    );

    expect(screen.getByText("waiting")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Offline analyzer")).toBeInTheDocument();
  });
});
