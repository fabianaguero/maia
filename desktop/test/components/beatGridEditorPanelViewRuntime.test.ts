import { describe, expect, it } from "vitest";

import { en } from "../../src/i18n/en";
import {
  buildBeatGridEditorPanelState,
  formatBeatSpacing,
  formatBpmInputValue,
  parseEditableBpm,
} from "../../src/features/analyzer/components/beatGridEditorPanelViewRuntime";
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

describe("beatGridEditorPanelViewRuntime", () => {
  it("formats editable bpm values and spacing for display", () => {
    expect(formatBeatSpacing(0.5, "Pending")).toBe("0.500s");
    expect(formatBeatSpacing(null, "Pending")).toBe("Pending");
    expect(formatBpmInputValue(126.125)).toBe("126.125");
    expect(formatBpmInputValue(null)).toBe("");
    expect(parseEditableBpm("126.25")).toBe(126.25);
    expect(parseEditableBpm("20")).toBeNull();
  });

  it("builds an editable panel state with derived metrics and controls", () => {
    const state = buildBeatGridEditorPanelState({
      track: createTrack(),
      busy: false,
      currentTime: 12.75,
      bpmInput: "124",
      onUpdateAnalysis: async () => undefined,
      t: en,
    });

    expect(state.parsedBpm).toBe(124);
    expect(state.effectiveBpm).toBe(124);
    expect(state.canEditGrid).toBe(true);
    expect(state.canSetGrid).toBe(true);
    expect(state.canNudgeGrid).toBe(true);
    expect(state.metrics).toContainEqual(
      expect.objectContaining({ key: "grid-bpm", value: "120.00" }),
    );
    expect(state.metrics).toContainEqual(
      expect.objectContaining({ key: "grid-anchor", value: "0:00.00" }),
    );
    expect(state.metrics).toContainEqual(
      expect.objectContaining({ key: "edit-state", value: "Ready" }),
    );
  });

  it("reports locked and unavailable states when editing cannot persist", () => {
    const track = createTrack(true);
    track.analysis.bpm = null;
    track.analysis.durationSeconds = null;
    track.analysis.beatGrid = [];

    const state = buildBeatGridEditorPanelState({
      track,
      busy: true,
      currentTime: 3,
      bpmInput: "",
      t: en,
    });

    expect(state.canPersist).toBe(false);
    expect(state.canEditGrid).toBe(false);
    expect(state.canSetGrid).toBe(false);
    expect(state.canNudgeGrid).toBe(false);
    expect(state.metrics).toContainEqual(
      expect.objectContaining({ key: "grid-bpm", value: "Pending" }),
    );
    expect(state.metrics).toContainEqual(
      expect.objectContaining({ key: "edit-state", value: "Unavailable" }),
    );
  });
});
