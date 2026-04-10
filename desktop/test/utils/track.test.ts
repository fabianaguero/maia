import { describe, expect, it } from "vitest";

import type { LibraryTrack } from "../../src/types/library";
import {
  canCreateBeatLoop,
  canCreateHotCue,
  canCreateSavedLoop,
  createTrackCuePoint,
  createTrackSavedLoop,
  createTrackSavedLoopFromRange,
  describeTrackPlaybackSource,
  describeTrackStorage,
  formatTrackTime,
  getTrackCompareAuditionPoints,
  findNearestBeatGridSecond,
  getTrackAvailabilityLabel,
  getTrackOriginalWaveformCues,
  getTrackSourcePath,
  getTrackTitle,
  getTrackWaveformCues,
  getTrackWaveformRegions,
  hasUsableBeatGrid,
  moveTrackSavedLoop,
  nudgeTrackSecond,
  removeTrackCuePoint,
  removeTrackSavedLoop,
  resolveTrackPlacementSecond,
  resolvePlayableTrackPath,
  setTrackCuePointSecond,
  setTrackSavedLoopBoundary,
  snapTrackSecond,
  updateTrackCuePoint,
  updateTrackSavedLoop,
} from "../../src/utils/track";

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
      beatGrid: [{ index: 0, second: 0 }],
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
      rating: 0,
      playCount: 0,
      lastPlayedAt: null,
      bpmLock: false,
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
      memoryCues: [],
      savedLoops: [],
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

describe("track utils", () => {
  it("prefers nested track records over legacy flat fields", () => {
    const track = createTrack();

    expect(getTrackTitle(track)).toBe("Source Track");
    expect(getTrackSourcePath(track)).toBe("/music/source.wav");
    expect(resolvePlayableTrackPath(track)).toBe("/managed/source.wav");
    expect(getTrackAvailabilityLabel(track)).toBe("Available");
  });

  it("describes managed snapshots and browser fallback correctly", () => {
    const track = createTrack();

    expect(describeTrackStorage(track)).toBe("Managed snapshot");
    expect(describeTrackPlaybackSource(track)).toBe("Managed snapshot");

    const browserFallbackTrack: LibraryTrack = {
      ...track,
      file: {
        ...track.file,
        storagePath: "browser-fallback://track.wav",
      },
    };

    expect(describeTrackStorage(browserFallbackTrack)).toBe("Simulated snapshot");
    expect(describeTrackPlaybackSource(browserFallbackTrack)).toBe("Browser fallback");
    expect(resolvePlayableTrackPath(browserFallbackTrack)).toBe("/music/source.wav");
  });

  it("formats track time and derives waveform cues from performance metadata", () => {
    const track = createTrack();

    expect(formatTrackTime(24.25)).toBe("0:24.25");

    const cues = getTrackWaveformCues(track);
    expect(cues).toHaveLength(2);
    expect(cues[0]).toMatchObject({
      label: "Main",
      second: 12.5,
      type: "main",
    });
    expect(cues[1]).toMatchObject({
      label: "Drop",
      second: 24.25,
      type: "hot",
    });

    const originalTrack: LibraryTrack = {
      ...track,
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

    expect(getTrackOriginalWaveformCues(originalTrack)).toEqual([
      {
        second: 8,
        label: "Legacy intro",
        type: "legacy",
      },
    ]);

    expect(getTrackCompareAuditionPoints(originalTrack)).toEqual([
      {
        id: "original",
        label: "Base cue",
        detail: "Legacy intro",
        second: 8,
      },
      {
        id: "altered",
        label: "Mutation cue",
        detail: "Main cue",
        second: 12.5,
      },
    ]);
  });

  it("falls back to visualization cues when no performance cues are stored", () => {
    const track = createTrack();
    const fallbackTrack: LibraryTrack = {
      ...track,
      performance: {
        ...track.performance,
        mainCueSecond: null,
        hotCues: [],
        memoryCues: [],
      },
      visualization: {
        waveform: [],
        beatGrid: [],
        hotCues: [
          {
            second: 33,
            label: "Legacy cue",
            type: "legacy",
          },
        ],
      },
    };

    expect(getTrackWaveformCues(fallbackTrack)).toEqual([
      {
        second: 33,
        label: "Legacy cue",
        type: "legacy",
      },
    ]);

    expect(getTrackCompareAuditionPoints(fallbackTrack)).toEqual([
      {
        id: "original",
        label: "Base cue",
        detail: "Legacy cue",
        second: 33,
      },
      {
        id: "altered",
        label: "Mutation cue",
        detail: "Legacy cue",
        second: 33,
      },
    ]);
  });

  it("creates snapped hot cues with stable slot assignment", () => {
    const track = createTrack();
    const cue = createTrackCuePoint(
      "hot",
      500,
      track.performance.hotCues,
      track.analysis.durationSeconds,
    );

    expect(snapTrackSecond(500, track.analysis.durationSeconds)).toBe(240);
    expect(canCreateHotCue(track.performance.hotCues)).toBe(true);
    expect(cue).toMatchObject({
      id: "hot-2-240000",
      slot: 2,
      second: 240,
      label: "Hot 2",
      kind: "hot",
      color: "#22d3ee",
    });
  });

  it("removes cues by id and blocks hot cues after slot capacity", () => {
    const track = createTrack();
    const hotCues = Array.from({ length: 8 }, (_, index) => ({
      id: `hot-${index + 1}`,
      slot: index + 1,
      second: index * 8,
      label: `Hot ${index + 1}`,
      kind: "hot" as const,
      color: null,
    }));

    expect(removeTrackCuePoint(track.performance.hotCues, "hot-1")).toEqual([]);
    expect(canCreateHotCue(hotCues)).toBe(false);
    expect(() =>
      createTrackCuePoint("hot", 12, hotCues, track.analysis.durationSeconds),
    ).toThrow("No hot cue slots available");
  });

  it("creates beat-sized saved loops and removes them by id", () => {
    const track = createTrack();
    const loop = createTrackSavedLoop(
      32,
      8,
      track.analysis.bpm,
      track.performance.savedLoops,
      track.analysis.durationSeconds,
    );

    expect(canCreateSavedLoop(track.performance.savedLoops)).toBe(true);
    expect(canCreateBeatLoop(track.analysis.bpm, 32, 8, track.analysis.durationSeconds)).toBe(
      true,
    );
    expect(loop).toMatchObject({
      id: "loop-1-32000-8",
      slot: 1,
      startSecond: 32,
      endSecond: 35.75,
      label: "Loop A",
      locked: false,
    });
    expect(removeTrackSavedLoop([loop], loop.id)).toEqual([]);
  });

  it("creates explicit-range loops and exposes loop regions for the waveform", () => {
    const track = createTrack();
    const rangeLoop = createTrackSavedLoopFromRange(
      96,
      103.5,
      [
        {
          id: "loop-1",
          slot: 1,
          startSecond: 64,
          endSecond: 72,
          label: "Loop A",
          color: "#22d3ee",
          locked: true,
        },
      ],
      track.analysis.durationSeconds,
      "Phrase 2",
    );

    expect(rangeLoop).toEqual({
      id: "loop-2-96000-103500",
      slot: 2,
      startSecond: 96,
      endSecond: 103.5,
      label: "Phrase 2",
      color: null,
      locked: false,
    });

    expect(
      getTrackWaveformRegions({
        ...track,
        performance: {
          ...track.performance,
          savedLoops: [
            {
              id: "loop-1",
              slot: 1,
              startSecond: 64,
              endSecond: 72,
              label: "Loop A",
              color: "#22d3ee",
              locked: true,
            },
          ],
        },
      }),
    ).toEqual([
      {
        id: "loop-1",
        startSecond: 64,
        endSecond: 72,
        label: "Loop A",
        type: "loop",
        color: "#22d3ee",
        excerpt: "Slot 1 · Locked",
      },
    ]);
  });

  it("moves cue points with beatgrid quantization and keeps ordering stable", () => {
    const movedCues = setTrackCuePointSecond(
      [
        {
          id: "hot-1",
          slot: 1,
          second: 24.25,
          label: "Drop",
          kind: "hot",
          color: null,
        },
        {
          id: "hot-2",
          slot: 2,
          second: 48,
          label: "Peak",
          kind: "hot",
          color: null,
        },
      ],
      "hot-2",
      24.31,
      {
        durationSeconds: 240,
        beatGrid: [
          { index: 0, second: 24 },
          { index: 1, second: 24.25 },
          { index: 2, second: 24.5 },
        ],
        quantizeEnabled: true,
      },
    );

    expect(movedCues).toEqual([
      {
        id: "hot-1",
        slot: 1,
        second: 24.25,
        label: "Drop",
        kind: "hot",
        color: null,
      },
      {
        id: "hot-2",
        slot: 2,
        second: 24.25,
        label: "Peak",
        kind: "hot",
        color: null,
      },
    ]);
  });

  it("moves full saved loops while preserving span and duration bounds", () => {
    const movedLoops = moveTrackSavedLoop(
      [
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
      "loop-1",
      239.8,
      {
        durationSeconds: 240,
        beatGrid: [
          { index: 0, second: 232 },
          { index: 1, second: 232.5 },
          { index: 2, second: 233 },
        ],
        quantizeEnabled: true,
      },
    );

    expect(movedLoops).toEqual([
      {
        id: "loop-1",
        slot: 1,
        startSecond: 232,
        endSecond: 240,
        label: "Loop A",
        color: null,
        locked: false,
      },
    ]);
  });

  it("nudges track positions by beat, bar, or fine slip", () => {
    const beatGrid = [
      { index: 0, second: 24 },
      { index: 1, second: 24.5 },
      { index: 2, second: 25 },
      { index: 3, second: 25.5 },
      { index: 4, second: 26 },
      { index: 5, second: 26.5 },
      { index: 6, second: 27 },
      { index: 7, second: 27.5 },
      { index: 8, second: 28 },
    ];

    expect(
      nudgeTrackSecond(24, 1, {
        durationSeconds: 240,
        beatGrid,
      }),
    ).toBe(24.5);
    expect(
      nudgeTrackSecond(24, 1, {
        durationSeconds: 240,
        beatGrid,
        coarse: true,
      }),
    ).toBe(26);
    expect(
      nudgeTrackSecond(24, -1, {
        durationSeconds: 240,
        beatGrid,
        freeSlip: true,
      }),
    ).toBe(23.98);
  });

  it("blocks saved loops without bpm, free slots, or positive duration", () => {
    const track = createTrack();
    const filledLoops = Array.from({ length: 8 }, (_, index) => ({
      id: `loop-${index + 1}`,
      slot: index + 1,
      startSecond: index * 4,
      endSecond: index * 4 + 2,
      label: `Loop ${String.fromCharCode(65 + index)}`,
      color: null,
      locked: false,
    }));

    expect(canCreateSavedLoop(filledLoops)).toBe(false);
    expect(canCreateBeatLoop(null, 32, 8, track.analysis.durationSeconds)).toBe(false);
    expect(canCreateBeatLoop(track.analysis.bpm, 240, 8, track.analysis.durationSeconds)).toBe(
      false,
    );
    expect(() =>
      createTrackSavedLoop(32, 8, null, [], track.analysis.durationSeconds),
    ).toThrow("BPM is required to create beat loops");
    expect(() =>
      createTrackSavedLoop(32, 8, track.analysis.bpm, filledLoops, track.analysis.durationSeconds),
    ).toThrow("No saved loop slots available");
  });

  it("updates cue and loop metadata without disturbing ordering", () => {
    const track = createTrack();
    const updatedCue = updateTrackCuePoint(track.performance.hotCues, "hot-1", {
      label: "  Drop Prime  ",
      color: "#ef4444",
    });
    const updatedLoop = updateTrackSavedLoop(
      [
        {
          id: "loop-2",
          slot: 2,
          startSecond: 80,
          endSecond: 84,
          label: "Loop B",
          color: null,
          locked: false,
        },
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
      "loop-2",
      {
        label: "  Outro loop ",
        color: "#22d3ee",
        locked: true,
      },
    );

    expect(updatedCue).toEqual([
      {
        id: "hot-1",
        slot: 1,
        second: 24.25,
        label: "Drop Prime",
        kind: "hot",
        color: "#ef4444",
      },
    ]);
    expect(updatedLoop).toEqual([
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
        id: "loop-2",
        slot: 2,
        startSecond: 80,
        endSecond: 84,
        label: "Outro loop",
        color: "#22d3ee",
        locked: true,
      },
    ]);
  });

  it("quantizes placement to the nearest usable beatgrid point", () => {
    const beatGrid = [
      { index: 0, second: 96.0 },
      { index: 1, second: 96.25 },
      { index: 2, second: 96.5 },
    ];

    expect(hasUsableBeatGrid([{ index: 0, second: 0 }])).toBe(false);
    expect(hasUsableBeatGrid(beatGrid)).toBe(true);
    expect(findNearestBeatGridSecond(96.31, beatGrid)).toBe(96.25);
    expect(resolveTrackPlacementSecond(96.31, 240, beatGrid, true)).toBe(96.25);
    expect(resolveTrackPlacementSecond(96.31, 240, beatGrid, false)).toBe(96.31);
    expect(resolveTrackPlacementSecond(96.31, 240, [{ index: 0, second: 0 }], true)).toBe(
      96.31,
    );
  });

  it("sets saved loop boundaries with quantize and preserves minimum span", () => {
    const loops = [
      {
        id: "loop-1",
        slot: 1,
        startSecond: 64,
        endSecond: 72,
        label: "Loop A",
        color: null,
        locked: false,
      },
    ];
    const beatGrid = [
      { index: 0, second: 63.75 },
      { index: 1, second: 64 },
      { index: 2, second: 64.25 },
      { index: 3, second: 71.75 },
      { index: 4, second: 72 },
    ];

    expect(
      setTrackSavedLoopBoundary(loops, "loop-1", "start", 63.82, {
        bpm: 128,
        durationSeconds: 240,
        beatGrid,
        quantizeEnabled: true,
      }),
    ).toEqual([
      {
        id: "loop-1",
        slot: 1,
        startSecond: 63.75,
        endSecond: 72,
        label: "Loop A",
        color: null,
        locked: false,
      },
    ]);

    expect(
      setTrackSavedLoopBoundary(loops, "loop-1", "end", 63.9, {
        bpm: 128,
        durationSeconds: 240,
        beatGrid,
        quantizeEnabled: false,
      }),
    ).toEqual([
      {
        id: "loop-1",
        slot: 1,
        startSecond: 64,
        endSecond: 64.469,
        label: "Loop A",
        color: null,
        locked: false,
      },
    ]);
  });
});
