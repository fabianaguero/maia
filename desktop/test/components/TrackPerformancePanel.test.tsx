import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TrackPerformancePanel } from "../../src/features/analyzer/components/TrackPerformancePanel";
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
          locked: true,
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
  };
}

describe("TrackPerformancePanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders performance metrics, locks, cues, and loops from nested metadata", () => {
    render(<TrackPerformancePanel track={createTrack()} />);

    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("4/5")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Locked")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Never")).toBeInTheDocument();

    const details = screen.getByText("Cues & loops").closest("details");
    details?.setAttribute("open", "");

    expect(screen.getByText("Drop · 0:24.25 · Slot 1")).toBeInTheDocument();
    expect(screen.getByText("Breakdown · 0:48.00 · memory")).toBeInTheDocument();
    expect(
      screen.getByText("Loop A · 1:04.00 -> 1:12.00 · Slot 1 · Locked"),
    ).toBeInTheDocument();
  });

  it("emits performance updates for rating, locks, color, and play count", () => {
    const onUpdatePerformance = vi.fn().mockResolvedValue(undefined);

    const view = render(
      <TrackPerformancePanel
        track={createTrack()}
        onUpdatePerformance={onUpdatePerformance}
      />,
    );

    const controls = within(view.container);

    fireEvent.change(controls.getByLabelText("Performance rating"), {
      target: { value: "5" },
    });
    fireEvent.change(controls.getByLabelText("Performance color"), {
      target: { value: "#22d3ee" },
    });
    fireEvent.click(controls.getByRole("button", { name: "Unlock BPM" }));
    fireEvent.click(controls.getByRole("button", { name: "Lock grid" }));
    fireEvent.click(controls.getByRole("button", { name: "Mark played" }));

    expect(onUpdatePerformance).toHaveBeenCalledWith({ rating: 5 });
    expect(onUpdatePerformance).toHaveBeenCalledWith({ color: "#22d3ee" });
    expect(onUpdatePerformance).toHaveBeenCalledWith({ bpmLock: false });
    expect(onUpdatePerformance).toHaveBeenCalledWith({ gridLock: true });
    expect(onUpdatePerformance).toHaveBeenCalledWith({ markPlayed: true });
  });

  it("emits playhead-driven cue updates and removal actions", () => {
    const onUpdatePerformance = vi.fn().mockResolvedValue(undefined);

    render(
      <TrackPerformancePanel
        track={createTrack()}
        currentTime={96.375}
        onUpdatePerformance={onUpdatePerformance}
      />,
    );

    const details = screen.getByText("Cues & loops").closest("details");
    details?.setAttribute("open", "");

    fireEvent.click(screen.getByRole("button", { name: "Set main cue" }));
    fireEvent.click(screen.getByRole("button", { name: "Add hot cue" }));
    fireEvent.click(screen.getByRole("button", { name: "Add memory cue" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Drop" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Breakdown" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear main cue" }));

    expect(onUpdatePerformance).toHaveBeenCalledWith({ mainCueSecond: 96.375 });
    expect(onUpdatePerformance).toHaveBeenCalledWith({
      hotCues: [
        {
          id: "hot-1",
          slot: 1,
          second: 24.25,
          label: "Drop",
          kind: "hot",
          color: null,
        },
        {
          id: "hot-2-96375",
          slot: 2,
          second: 96.375,
          label: "Hot 2",
          kind: "hot",
          color: "#22d3ee",
        },
      ],
    });
    expect(onUpdatePerformance).toHaveBeenCalledWith({
      memoryCues: [
        {
          id: "memory-1",
          slot: null,
          second: 48,
          label: "Breakdown",
          kind: "memory",
          color: null,
        },
        {
          id: "memory-2-96375",
          slot: null,
          second: 96.375,
          label: "Memory 2",
          kind: "memory",
          color: null,
        },
      ],
    });
    expect(onUpdatePerformance).toHaveBeenCalledWith({ hotCues: [] });
    expect(onUpdatePerformance).toHaveBeenCalledWith({ memoryCues: [] });
    expect(onUpdatePerformance).toHaveBeenCalledWith({ mainCueSecond: null });
  });

  it("emits beat-sized saved loop updates from the current playhead", () => {
    const onUpdatePerformance = vi.fn().mockResolvedValue(undefined);

    render(
      <TrackPerformancePanel
        track={createTrack()}
        currentTime={96.375}
        onUpdatePerformance={onUpdatePerformance}
      />,
    );

    const details = screen.getByText("Cues & loops").closest("details");
    details?.setAttribute("open", "");

    fireEvent.click(screen.getByRole("button", { name: "Save 4-beat loop" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Loop A" }));

    expect(onUpdatePerformance).toHaveBeenCalledWith({
      savedLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 64,
          endSecond: 72,
          label: "Loop A",
          color: null,
          locked: true,
        },
        {
          id: "loop-2-96375-4",
          slot: 2,
          startSecond: 96.375,
          endSecond: 98.28,
          label: "Loop B",
          color: null,
          locked: false,
        },
      ],
    });
    expect(onUpdatePerformance).toHaveBeenCalledWith({ savedLoops: [] });
  });

  it("edits cue and loop metadata inline", () => {
    const onUpdatePerformance = vi.fn().mockResolvedValue(undefined);

    render(
      <TrackPerformancePanel
        track={createTrack()}
        currentTime={96.375}
        onUpdatePerformance={onUpdatePerformance}
      />,
    );

    const details = screen.getByText("Cues & loops").closest("details");
    details?.setAttribute("open", "");

    fireEvent.change(screen.getByLabelText("Cue label hot-1"), {
      target: { value: "Drop Prime" },
    });
    fireEvent.blur(screen.getByLabelText("Cue label hot-1"));
    fireEvent.change(screen.getByLabelText("Cue color hot-1"), {
      target: { value: "#ef4444" },
    });
    fireEvent.change(screen.getByLabelText("Loop label loop-1"), {
      target: { value: "Loop Prime" },
    });
    fireEvent.blur(screen.getByLabelText("Loop label loop-1"));
    fireEvent.change(screen.getByLabelText("Loop color loop-1"), {
      target: { value: "#8b5cf6" },
    });
    fireEvent.click(screen.getByLabelText("Toggle loop lock loop-1"));

    expect(onUpdatePerformance).toHaveBeenCalledWith({
      hotCues: [
        {
          id: "hot-1",
          slot: 1,
          second: 24.25,
          label: "Drop Prime",
          kind: "hot",
          color: null,
        },
      ],
    });
    expect(onUpdatePerformance).toHaveBeenCalledWith({
      hotCues: [
        {
          id: "hot-1",
          slot: 1,
          second: 24.25,
          label: "Drop",
          kind: "hot",
          color: "#ef4444",
        },
      ],
    });
    expect(onUpdatePerformance).toHaveBeenCalledWith({
      savedLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 64,
          endSecond: 72,
          label: "Loop Prime",
          color: null,
          locked: true,
        },
      ],
    });
    expect(onUpdatePerformance).toHaveBeenCalledWith({
      savedLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 64,
          endSecond: 72,
          label: "Loop A",
          color: "#8b5cf6",
          locked: true,
        },
      ],
    });
    expect(onUpdatePerformance).toHaveBeenCalledWith({
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
    });
  });

  it("quantizes cue placement to beatgrid and allows free placement when toggled off", () => {
    const onUpdatePerformance = vi.fn().mockResolvedValue(undefined);
    const quantizedTrack: LibraryTrack = {
      ...createTrack(),
      analysis: {
        ...createTrack().analysis,
        beatGrid: [
          { index: 0, second: 96 },
          { index: 1, second: 96.25 },
          { index: 2, second: 96.5 },
        ],
      },
    };

    render(
      <TrackPerformancePanel
        track={quantizedTrack}
        currentTime={96.31}
        onUpdatePerformance={onUpdatePerformance}
      />,
    );

    const details = screen.getByText("Cues & loops").closest("details");
    details?.setAttribute("open", "");

    expect(screen.getByRole("button", { name: "Quantize on" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Set main cue" }));
    fireEvent.click(screen.getByRole("button", { name: "Add hot cue" }));
    fireEvent.click(screen.getByRole("button", { name: "Quantize on" }));
    fireEvent.click(screen.getByRole("button", { name: "Add memory cue" }));

    expect(onUpdatePerformance).toHaveBeenCalledWith({ mainCueSecond: 96.25 });
    expect(onUpdatePerformance).toHaveBeenCalledWith({
      hotCues: [
        {
          id: "hot-1",
          slot: 1,
          second: 24.25,
          label: "Drop",
          kind: "hot",
          color: null,
        },
        {
          id: "hot-2-96250",
          slot: 2,
          second: 96.25,
          label: "Hot 2",
          kind: "hot",
          color: "#22d3ee",
        },
      ],
    });
    expect(onUpdatePerformance).toHaveBeenCalledWith({
      memoryCues: [
        {
          id: "memory-1",
          slot: null,
          second: 48,
          label: "Breakdown",
          kind: "memory",
          color: null,
        },
        {
          id: "memory-2-96310",
          slot: null,
          second: 96.31,
          label: "Memory 2",
          kind: "memory",
          color: null,
        },
      ],
    });
  });

  it("adjusts loop boundaries with quantize and free placement", () => {
    const onUpdatePerformance = vi.fn().mockResolvedValue(undefined);
    const quantizedTrack: LibraryTrack = {
      ...createTrack(),
      analysis: {
        ...createTrack().analysis,
        bpm: 128,
        beatGrid: [
          { index: 0, second: 71.5 },
          { index: 1, second: 71.75 },
          { index: 2, second: 72 },
        ],
      },
    };

    render(
      <TrackPerformancePanel
        track={quantizedTrack}
        currentTime={71.82}
        onUpdatePerformance={onUpdatePerformance}
      />,
    );

    const details = screen.getByText("Cues & loops").closest("details");
    details?.setAttribute("open", "");

    fireEvent.click(screen.getByLabelText("Set loop end loop-1"));
    fireEvent.click(screen.getByRole("button", { name: "Quantize on" }));
    fireEvent.click(screen.getByLabelText("Set loop end loop-1"));

    expect(onUpdatePerformance).toHaveBeenCalledWith({
      savedLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 64,
          endSecond: 71.75,
          label: "Loop A",
          color: null,
          locked: true,
        },
      ],
    });
    expect(onUpdatePerformance).toHaveBeenCalledWith({
      savedLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 64,
          endSecond: 71.82,
          label: "Loop A",
          color: null,
          locked: true,
        },
      ],
    });
  });

  it("turns a selected phrase into cues and loops", () => {
    const onUpdatePerformance = vi.fn().mockResolvedValue(undefined);

    render(
      <TrackPerformancePanel
        track={createTrack()}
        currentTime={96.375}
        selectedPhraseRange={{
          startSecond: 96,
          endSecond: 103.5,
          startBeatIndex: 16,
          endBeatIndex: 32,
          beatCount: 16,
          label: "Phrase 2",
        }}
        onUpdatePerformance={onUpdatePerformance}
      />,
    );

    const details = screen.getByText("Cues & loops").closest("details");
    details?.setAttribute("open", "");

    fireEvent.click(screen.getByRole("button", { name: "Set cue to phrase start" }));
    fireEvent.click(screen.getByRole("button", { name: "Add phrase memory cue" }));
    fireEvent.click(screen.getByRole("button", { name: "Save phrase loop" }));

    expect(onUpdatePerformance).toHaveBeenCalledWith({ mainCueSecond: 96 });
    expect(onUpdatePerformance).toHaveBeenCalledWith({
      memoryCues: [
        {
          id: "memory-1",
          slot: null,
          second: 48,
          label: "Breakdown",
          kind: "memory",
          color: null,
        },
        {
          id: "memory-2-96000",
          slot: null,
          second: 96,
          label: "Memory 2",
          kind: "memory",
          color: null,
        },
      ],
    });
    expect(onUpdatePerformance).toHaveBeenCalledWith({
      savedLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 64,
          endSecond: 72,
          label: "Loop A",
          color: null,
          locked: true,
        },
        {
          id: "loop-2-96000-103500",
          slot: 2,
          startSecond: 96,
          endSecond: 103.5,
          label: "Phrase 2",
          color: null,
          locked: false,
        },
      ],
    });
  });
});
