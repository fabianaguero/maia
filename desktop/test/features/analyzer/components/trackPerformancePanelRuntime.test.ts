import { describe, expect, it, vi } from "vitest";

import type { LibraryTrack, UpdateTrackPerformanceInput } from "../../../../src/types/library";
import {
  buildQuantizedPlacementHint,
  buildTrackColorOptions,
  buildTrackPerformanceMetrics,
  buildTrackPerformancePanelState,
  createTrackPerformanceActions,
  LOOP_BEAT_PRESETS,
  renderCueLabel,
  renderLoopLabel,
  resolveTrackPerformancePlacement,
} from "../../../../src/features/analyzer/components/trackPerformancePanelRuntime";

function createTrack(): LibraryTrack {
  const importedAt = "2026-04-08T12:00:00.000Z";
  const sourcePath = "/music/source.wav";
  const storagePath = "/managed/source.wav";

  return {
    id: "track-1",
    file: {
      sourcePath,
      storagePath,
      sourceKind: "file",
      fileExtension: ".wav",
      sizeBytes: 1234,
      modifiedAt: importedAt,
      checksum: null,
      availabilityState: "available",
      playbackSource: "managed_snapshot",
    },
    tags: {
      title: "Source Track",
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
      bpm: 128,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [0.2, 0.4],
      beatGrid: [
        { index: 0, second: 96.0 },
        { index: 1, second: 96.25 },
        { index: 2, second: 96.5 },
      ],
      bpmCurve: [{ second: 0, bpm: 128 }],
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
      color: null,
      rating: 3,
      playCount: 7,
      lastPlayedAt: importedAt,
      bpmLock: false,
      gridLock: true,
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
          second: 16,
          label: "Verse",
          kind: "memory",
          color: "#22d3ee",
        },
      ],
      savedLoops: [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 32,
          endSecond: 36,
          label: "Loop A",
          color: null,
          locked: false,
        },
      ],
    },
    title: "Legacy Title",
    sourcePath,
    storagePath,
    importedAt,
    bpm: 110,
    bpmConfidence: 0.2,
    durationSeconds: 120,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "pending",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "pending",
    notes: [],
    fileExtension: ".mp3",
    analysisMode: "legacy-mode",
    musicStyleId: "legacy",
    musicStyleLabel: "Legacy",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
  };
}

const t = {
  inspect: {
    none: "None",
    amber: "Amber",
    cyan: "Cyan",
    red: "Red",
    violet: "Violet",
    lime: "Lime",
    availability: "Availability",
    missing: "Missing",
    available: "Available",
    mainCue: "Main cue",
    hotCues: "Hot cues",
    memoryCues: "Memory cues",
    savedLoops: "Saved loops",
    rating: "Rating",
    playCount: "Play count",
    lastPlayed: "Last played",
    never: "Never",
    bpmLockLabel: "BPM lock",
    gridLockLabel: "Grid lock",
    locked: "Locked",
    open: "Open",
  },
} as const;

describe("trackPerformancePanelRuntime", () => {
  it("builds color options, labels and performance metrics", () => {
    const track = createTrack();

    expect(buildTrackColorOptions(t)).toEqual([
      { value: "", label: "None" },
      { value: "#f59e0b", label: "Amber" },
      { value: "#22d3ee", label: "Cyan" },
      { value: "#ef4444", label: "Red" },
      { value: "#8b5cf6", label: "Violet" },
      { value: "#84cc16", label: "Lime" },
    ]);

    expect(renderCueLabel(track.performance.hotCues[0]!, "Slot {slot}")).toContain("Drop");
    expect(
      renderLoopLabel(
        track.performance.savedLoops[0]!,
        "Slot {slot}",
        "Loop",
        "Locked",
        "Editable",
      ),
    ).toContain("Editable");

    const metrics = buildTrackPerformanceMetrics({ track, t });
    expect(metrics).toHaveLength(10);
    expect(metrics[0]).toEqual({
      key: "availability",
      label: "Availability",
      value: "Available",
    });
    expect(metrics[8]!.value).toBe("Open");
    expect(metrics[9]!.value).toBe("Locked");
  });

  it("builds panel state and resolves quantized placement hints", () => {
    const track = createTrack();
    const onUpdatePerformance = vi.fn();

    const state = buildTrackPerformancePanelState({
      track,
      busy: false,
      currentTime: 96.31,
      onUpdatePerformance,
    });

    expect(state.canEditPerformance).toBe(true);
    expect(state.canAddHot).toBe(true);
    expect(state.canAddLoop).toBe(true);
    expect(state.quantizeAvailable).toBe(true);

    const placementSecond = resolveTrackPerformancePlacement({
      currentTime: 96.31,
      durationSeconds: track.analysis.durationSeconds,
      beatGrid: track.analysis.beatGrid,
      quantizeEnabled: true,
    });

    expect(placementSecond).toBe(96.25);
    expect(
      buildQuantizedPlacementHint({
        currentTime: 96.31,
        placementSecond,
        durationSeconds: track.analysis.durationSeconds,
        quantizedToTemplate: "Quantized to {time}",
      }),
    ).toContain("Quantized to");
    expect(
      buildQuantizedPlacementHint({
        currentTime: 96.31,
        placementSecond: -1,
        durationSeconds: track.analysis.durationSeconds,
        quantizedToTemplate: "Quantized to {time}",
        pendingLabel: "Pendiente",
      }),
    ).toContain("Pendiente");
  });

  it("creates cue and loop updates through the performance actions facade", async () => {
    const track = createTrack();
    const updates: UpdateTrackPerformanceInput[] = [];
    const onUpdatePerformance = vi.fn(async (update: UpdateTrackPerformanceInput) => {
      updates.push(update);
    });

    const actions = createTrackPerformanceActions({
      track,
      currentTime: 64.2,
      selectedPhraseRange: {
        startSecond: 64,
        endSecond: 72,
        label: "Phrase A",
        beatCount: 16,
      },
      canEditPerformance: true,
      quantizeEnabled: true,
      onUpdatePerformance,
    });

    expect(LOOP_BEAT_PRESETS).toEqual([4, 8, 16]);

    await actions.addCue("hot");
    await actions.addCue("memory");
    await actions.addSavedLoop(8);
    await actions.addSelectedPhraseLoop();
    await actions.addPhraseMemoryCue();

    expect(onUpdatePerformance).toHaveBeenCalledTimes(5);
    expect(updates[0]!.hotCues).toHaveLength(2);
    expect(updates[1]!.memoryCues).toHaveLength(2);
    expect(updates[2]!.savedLoops).toHaveLength(2);
    expect(updates[3]!.savedLoops?.at(-1)?.label).toBe("Phrase A");
    expect(updates[4]!.memoryCues?.at(-1)?.second).toBe(64);
    expect(actions.canCreateBeatLoopAtPlacement(8)).toBe(true);
  });

  it("patches and removes performance entities, and no-ops when editing is disabled", async () => {
    const track = createTrack();
    const onUpdatePerformance = vi.fn(async () => undefined);

    const editable = createTrackPerformanceActions({
      track,
      currentTime: 40.1,
      selectedPhraseRange: null,
      canEditPerformance: true,
      quantizeEnabled: false,
      onUpdatePerformance,
    });

    await editable.removeCue("hot", "hot-1");
    await editable.patchCue("memory", "memory-1", { label: "Break", color: "#ef4444" });
    await editable.removeSavedLoop("loop-1");
    await editable.patchSavedLoop("loop-1", { label: "Loop B", locked: true });
    await editable.setSavedLoopBoundary("loop-1", "end");

    expect(onUpdatePerformance).toHaveBeenCalledTimes(5);
    expect(onUpdatePerformance.mock.calls[0]![0].hotCues).toHaveLength(0);
    expect(onUpdatePerformance.mock.calls[1]![0].memoryCues[0]!.label).toBe("Break");
    expect(onUpdatePerformance.mock.calls[2]![0].savedLoops).toHaveLength(0);
    expect(onUpdatePerformance.mock.calls[3]![0].savedLoops[0]!.locked).toBe(true);
    expect(onUpdatePerformance.mock.calls[4]![0].savedLoops[0]!.endSecond).toBeGreaterThan(40);

    const disabled = createTrackPerformanceActions({
      track,
      currentTime: 48,
      selectedPhraseRange: null,
      canEditPerformance: false,
      quantizeEnabled: false,
      onUpdatePerformance,
    });

    await disabled.addCue("hot");
    expect(onUpdatePerformance).toHaveBeenCalledTimes(5);
  });
});
