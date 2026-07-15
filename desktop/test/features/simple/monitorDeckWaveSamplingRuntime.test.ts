import { describe, expect, it } from "vitest";

import { sampleTrackWaveWindow } from "../../../src/features/simple/monitorDeckWaveSamplingRuntime";

describe("monitorDeckWaveSamplingRuntime", () => {
  it("moves and locally amplifies low-resolution heuristic waveforms", () => {
    const sparseBins = Array.from({ length: 32 }, (_, index) =>
      index % 7 === 0 ? 0.92 : 0.12 + (index % 5) * 0.08,
    );
    const early = sampleTrackWaveWindow(sparseBins, 0.1, 300, 125, [], 120);
    const later = sampleTrackWaveWindow(sparseBins, 0.55, 300, 125, [], 120);

    expect(early).not.toEqual(later);
    expect(Math.max(...early) - Math.min(...early)).toBeGreaterThan(0.5);
    expect(Math.max(...later) - Math.min(...later)).toBeGreaterThan(0.5);
  });

  it("animates the fallback texture when no waveform bins are available", () => {
    const first = sampleTrackWaveWindow(null, 0.05, 240, 120, [], 120);
    const second = sampleTrackWaveWindow(null, 0.25, 240, 120, [], 120);

    expect(first).not.toEqual(second);
  });

  it("moves a known track peak left as playback advances", () => {
    const bins = Array.from({ length: 256 }, () => 0.05);
    bins[130] = 1;
    const before = sampleTrackWaveWindow(bins, 0.495, 256, 120, [], 240);
    const after = sampleTrackWaveWindow(bins, 0.505, 256, 120, [], 240);
    const peakBefore = before.indexOf(Math.max(...before));
    const peakAfter = after.indexOf(Math.max(...after));

    expect(peakAfter).toBeLessThan(peakBefore);
  });

  it("expands subtle dense waveform dynamics instead of drawing a flat plateau", () => {
    const bins = Array.from({ length: 512 }, (_, index) => 0.48 + Math.sin(index / 11) * 0.008);
    const samples = sampleTrackWaveWindow(bins, 0.5, 240, 120, [], 240);

    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.45);
  });
});
