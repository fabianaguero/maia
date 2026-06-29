import { describe, expect, it, vi } from "vitest";

import type { LibraryTrack } from "../../src/types/library";
import {
  buildTrackPerformanceMetrics,
  buildQuantizedPlacementHint,
  buildTrackPerformancePanelState,
  createTrackPerformanceActions,
  renderCueLabel,
  renderLoopLabel,
} from "../../src/features/analyzer/components/trackPerformancePanelRuntime";
import { en } from "../../src/i18n/en";

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

describe("trackPerformancePanelRuntime", () => {
  it("builds panel state from track and editor availability", () => {
    expect(
      buildTrackPerformancePanelState({
        track: createTrack(),
        busy: false,
        currentTime: 12,
        onUpdatePerformance: vi.fn(async () => {}),
      }),
    ).toMatchObject({
      canEditPerformance: true,
      canAddHot: true,
      canAddLoop: true,
      quantizeAvailable: false,
    });
  });

  it("formats cue and loop labels", () => {
    const track = createTrack();

    expect(renderCueLabel(track.performance.hotCues[0]!, "Slot {slot}")).toBe(
      "Drop · 0:24.25 · Slot 1",
    );
    expect(
      renderLoopLabel(
        track.performance.savedLoops[0]!,
        "Slot {slot}",
        "Loop",
        "Locked",
        "Editable",
      ),
    ).toBe("Loop A · 1:04.00 -> 1:12.00 · Slot 1 · Locked");
  });

  it("builds the summary metrics shown by the performance panel", () => {
    expect(buildTrackPerformanceMetrics({ track: createTrack(), t: en })).toEqual(
      expect.arrayContaining([
        {
          key: "availability",
          label: en.inspect.availability,
          value: en.inspect.available,
        },
        {
          key: "main-cue",
          label: en.inspect.mainCue,
          value: "0:12.50",
        },
        {
          key: "hot-cues",
          label: en.inspect.hotCues,
          value: "1",
        },
        {
          key: "grid-lock",
          label: en.inspect.gridLockLabel,
          value: en.inspect.open,
        },
      ]),
    );
  });

  it("creates performance actions that emit cue and loop updates", () => {
    const onUpdatePerformance = vi.fn(async () => {});
    const actions = createTrackPerformanceActions({
      track: createTrack(),
      currentTime: 96.375,
      selectedPhraseRange: null,
      canEditPerformance: true,
      quantizeEnabled: false,
      onUpdatePerformance,
    });

    actions.addCue("hot");
    actions.addSavedLoop(4);
    actions.removeSavedLoop("loop-1");

    expect(onUpdatePerformance).toHaveBeenCalledTimes(3);
    expect(onUpdatePerformance.mock.calls[0]?.[0]).toMatchObject({
      hotCues: expect.arrayContaining([
        expect.objectContaining({
          id: "hot-2-96375",
        }),
      ]),
    });
    expect(onUpdatePerformance.mock.calls[1]?.[0]).toMatchObject({
      savedLoops: expect.arrayContaining([
        expect.objectContaining({
          id: "loop-2-96375-4",
        }),
      ]),
    });
    expect(onUpdatePerformance.mock.calls[2]?.[0]).toEqual({ savedLoops: [] });
  });

  it("creates phrase memory cues and phrase loops from the selected range", () => {
    const onUpdatePerformance = vi.fn(async () => {});
    const actions = createTrackPerformanceActions({
      track: createTrack(),
      currentTime: 96.375,
      selectedPhraseRange: {
        startSecond: 96,
        endSecond: 103.5,
        startBeatIndex: 16,
        endBeatIndex: 32,
        beatCount: 16,
        label: "Phrase 2",
      },
      canEditPerformance: true,
      quantizeEnabled: false,
      onUpdatePerformance,
    });

    actions.addPhraseMemoryCue();
    actions.addSelectedPhraseLoop();

    expect(onUpdatePerformance.mock.calls[0]?.[0]).toMatchObject({
      memoryCues: expect.arrayContaining([
        expect.objectContaining({
          id: "memory-2-96000",
        }),
      ]),
    });
    expect(onUpdatePerformance.mock.calls[1]?.[0]).toMatchObject({
      savedLoops: expect.arrayContaining([
        expect.objectContaining({
          label: "Phrase 2",
        }),
      ]),
    });
  });

  it("builds a quantized placement hint only when the snapped position changes", () => {
    expect(
      buildQuantizedPlacementHint({
        currentTime: 10,
        placementSecond: 10,
        durationSeconds: 120,
        quantizedToTemplate: "Quantized to {time}",
      }),
    ).toBe("");

    expect(
      buildQuantizedPlacementHint({
        currentTime: 10.21,
        placementSecond: 10.5,
        durationSeconds: 120,
        quantizedToTemplate: "Quantized to {time}",
      }),
    ).toContain("10.50");
  });
});
