import { describe, expect, it, vi } from "vitest";

import { createBeatGridEditorActions } from "../../src/features/analyzer/components/beatGridEditorPanelActionsRuntime";
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

describe("beatGridEditorPanelActionsRuntime", () => {
  it("builds updates for apply, downbeat, nudge, and bpm scaling", async () => {
    const onUpdateAnalysis = vi.fn().mockResolvedValue(undefined);
    const actions = createBeatGridEditorActions({
      track: createTrack(),
      currentTime: 12.75,
      parsedBpm: 124,
      effectiveBpm: 124,
      canPersist: true,
      onUpdateAnalysis,
    });

    await actions.applyBpm();
    await actions.setDownbeatHere();
    await actions.nudgeGrid(0.25);

    const half = actions.scaleBpm(0.5);
    expect(half?.nextBpm).toBe(62);
    await actions.updateAnalysis(half?.update ?? null);

    expect(onUpdateAnalysis).toHaveBeenNthCalledWith(1, expect.objectContaining({ bpm: 124 }));
    expect(onUpdateAnalysis).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        beatGrid: expect.arrayContaining([expect.objectContaining({ second: 12.75 })]),
      }),
    );
    expect(onUpdateAnalysis).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        beatGrid: [
          { index: 0, second: 0.121 },
          { index: 1, second: 0.621 },
          { index: 2, second: 1.121 },
        ],
        bpm: 124,
      }),
    );
    expect(onUpdateAnalysis).toHaveBeenNthCalledWith(4, expect.objectContaining({ bpm: 62 }));
  });

  it("returns no updates when persistence or bpm validity is missing", async () => {
    const onUpdateAnalysis = vi.fn().mockResolvedValue(undefined);
    const actions = createBeatGridEditorActions({
      track: createTrack(),
      currentTime: 4,
      parsedBpm: null,
      effectiveBpm: null,
      canPersist: false,
      onUpdateAnalysis,
    });

    expect(await actions.applyBpm()).toBeUndefined();
    expect(await actions.setDownbeatHere()).toBeUndefined();
    expect(await actions.nudgeGrid(1)).toBeUndefined();
    expect(actions.scaleBpm(2)).toBeNull();
    expect(onUpdateAnalysis).not.toHaveBeenCalled();
  });
});
