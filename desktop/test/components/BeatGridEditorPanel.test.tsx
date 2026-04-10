import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BeatGridEditorPanel } from "../../src/features/analyzer/components/BeatGridEditorPanel";
import type { LibraryTrack } from "../../src/types/library";

function createTrack(gridLock = false): LibraryTrack {
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
      bpm: 120,
      bpmConfidence: 0.82,
      durationSeconds: 120,
      waveformBins: [0.2, 0.4],
      beatGrid: [
        { index: 0, second: 0 },
        { index: 1, second: 0.5 },
        { index: 2, second: 1 },
      ],
      bpmCurve: [{ second: 0, bpm: 120 }],
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
      gridLock,
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

describe("BeatGridEditorPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("emits beat grid analysis updates from BPM apply and playhead downbeat set", () => {
    const onUpdateAnalysis = vi.fn().mockResolvedValue(undefined);

    render(
      <BeatGridEditorPanel
        track={createTrack()}
        currentTime={12.75}
        onUpdateAnalysis={onUpdateAnalysis}
      />,
    );

    fireEvent.change(screen.getByLabelText("Beat grid BPM"), {
      target: { value: "124" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply BPM" }));
    fireEvent.click(screen.getByRole("button", { name: "Set downbeat here" }));

    expect(onUpdateAnalysis).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        bpm: 124,
        beatGrid: expect.arrayContaining([{ index: 0, second: 0 }]),
      }),
    );
    expect(onUpdateAnalysis).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        bpm: 124,
        beatGrid: expect.arrayContaining([
          expect.objectContaining({ second: 12.75 }),
        ]),
      }),
    );
  });

  it("nudges the existing beat grid by fractional and whole beats", () => {
    const onUpdateAnalysis = vi.fn().mockResolvedValue(undefined);

    render(
      <BeatGridEditorPanel
        track={createTrack()}
        currentTime={8}
        onUpdateAnalysis={onUpdateAnalysis}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Nudge +1/4" }));
    fireEvent.click(screen.getByRole("button", { name: "Nudge -1 beat" }));

    expect(onUpdateAnalysis).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        bpm: 120,
        beatGrid: [
          { index: 0, second: 0.125 },
          { index: 1, second: 0.625 },
          { index: 2, second: 1.125 },
        ],
      }),
    );
    expect(onUpdateAnalysis).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        bpm: 120,
        beatGrid: [
          { index: 0, second: 0 },
          { index: 1, second: 0.5 },
        ],
      }),
    );
  });

  it("disables editing controls while grid lock is enabled", () => {
    render(<BeatGridEditorPanel track={createTrack(true)} currentTime={4} />);

    expect(screen.getByRole("button", { name: "Set downbeat here" })).toBeDisabled();
    expect(screen.getByText(/Unlock grid in the Performance panel/i)).toBeInTheDocument();
  });
});
