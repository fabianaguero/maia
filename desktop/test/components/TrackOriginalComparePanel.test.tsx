import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TrackOriginalComparePanel } from "../../src/features/analyzer/components/TrackOriginalComparePanel";
import type { LibraryTrack } from "../../src/types/library";

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

describe("TrackOriginalComparePanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders original and altered compare decks with synced seek", () => {
    const onSeek = vi.fn();
    const onAudition = vi.fn();

    render(
      <TrackOriginalComparePanel
        track={createTrack()}
        currentTime={24}
        onSeek={onSeek}
        onAudition={onAudition}
        activeAuditionId="altered"
      />,
    );

    expect(screen.getByText("Original vs altered")).toBeInTheDocument();
    expect(screen.getByText("Base track")).toBeInTheDocument();
    expect(screen.getByText("Mutation map")).toBeInTheDocument();
    expect(screen.getByText("Original cues")).toBeInTheDocument();
    expect(screen.getByText("Altered cues")).toBeInTheDocument();
    expect(screen.getByText("Saved loops")).toBeInTheDocument();
    expect(screen.getByText("Delta")).toBeInTheDocument();
    expect(screen.getAllByText("Main cue")).toHaveLength(2);
    expect(screen.getAllByText("Legacy intro").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Loop A").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Audition Base cue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Audition Mutation cue" })).toHaveClass("active");
    expect(screen.getByRole("button", { name: "Audition Loop window" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Audition Mutation cue" }));

    expect(onAudition).toHaveBeenCalledWith({
      id: "altered",
      label: "Mutation cue",
      detail: "Main cue",
      second: 12.5,
    });
    expect(onSeek).not.toHaveBeenCalled();
  });
});
