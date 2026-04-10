import { describe, expect, it } from "vitest";

import {
  buildBeatGridFromAnchor,
  buildFlatBpmCurve,
  deriveBeatGridGuideMarkers,
  isEditableBpm,
  nudgeBeatGridByBeats,
  resolveBeatDurationSeconds,
  resolveBeatGridAnchorSecond,
  selectBeatGridPhrase,
  shiftBeatGrid,
} from "../../src/utils/beatGrid";

describe("beat grid utils", () => {
  it("builds a beat grid anchored at the chosen downbeat", () => {
    const beatGrid = buildBeatGridFromAnchor(120, 16, 5.5);

    expect(beatGrid[0]).toEqual({ index: 0, second: 0 });
    expect(beatGrid[11]).toEqual({ index: 11, second: 5.5 });
    expect(beatGrid.at(-1)).toEqual({ index: 32, second: 16 });
  });

  it("nudges an existing beat grid by beat fractions and keeps indices normalized", () => {
    const beatGrid = [
      { index: 0, second: 0.5 },
      { index: 1, second: 1 },
      { index: 2, second: 1.5 },
    ];

    expect(shiftBeatGrid(beatGrid, -0.25, 8)).toEqual([
      { index: 0, second: 0.25 },
      { index: 1, second: 0.75 },
      { index: 2, second: 1.25 },
    ]);

    expect(nudgeBeatGridByBeats(beatGrid, 120, 1, 8)).toEqual([
      { index: 0, second: 1 },
      { index: 1, second: 1.5 },
      { index: 2, second: 2 },
    ]);
  });

  it("rebuilds a flat bpm curve and resolves anchor + beat duration", () => {
    const beatGrid = buildBeatGridFromAnchor(128, 64, 2.5);

    expect(isEditableBpm(128)).toBe(true);
    expect(resolveBeatDurationSeconds(128, beatGrid)).toBeCloseTo(0.46875, 4);
    expect(resolveBeatGridAnchorSecond(beatGrid, 9)).toBe(0.156);
    expect(buildFlatBpmCurve(128, 64)).toEqual([
      { second: 0, bpm: 128 },
      { second: 15, bpm: 128 },
      { second: 30, bpm: 128 },
      { second: 45, bpm: 128 },
      { second: 60, bpm: 128 },
      { second: 64, bpm: 128 },
    ]);
  });

  it("selects phrase-aligned ranges from the beat grid", () => {
    const beatGrid = Array.from({ length: 65 }, (_, index) => ({
      index,
      second: index * 0.5,
    }));

    expect(selectBeatGridPhrase(12.1, beatGrid, 40, 16)).toEqual({
      startSecond: 8,
      endSecond: 16,
      startBeatIndex: 16,
      endBeatIndex: 32,
      beatCount: 16,
      label: "Phrase 2",
    });
    expect(selectBeatGridPhrase(4, [{ index: 0, second: 0 }], 40, 16)).toBeNull();
  });

  it("derives beat, bar, and phrase guide markers from the grid", () => {
    const markers = deriveBeatGridGuideMarkers(
      Array.from({ length: 17 }, (_, index) => ({
        index,
        second: index * 0.5,
      })),
      16,
    );

    expect(markers[0]).toEqual({
      index: 0,
      second: 0,
      emphasis: "phrase",
      label: "Phrase 1",
    });
    expect(markers[4]).toEqual({
      index: 4,
      second: 2,
      emphasis: "bar",
      label: "Bar 2",
    });
    expect(markers[5]).toEqual({
      index: 5,
      second: 2.5,
      emphasis: "beat",
      label: "Beat 6",
    });
    expect(markers[16]).toEqual({
      index: 16,
      second: 8,
      emphasis: "phrase",
      label: "Phrase 2",
    });
  });
});
