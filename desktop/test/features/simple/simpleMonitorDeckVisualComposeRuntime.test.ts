import { describe, expect, it } from "vitest";

import {
  buildSimpleMonitorDeckVisualCanvasEffectsInput,
  buildSimpleMonitorDeckVisualStateResult,
} from "../../../src/features/simple/simpleMonitorDeckVisualComposeRuntime";

describe("simpleMonitorDeckVisualComposeRuntime", () => {
  it("builds canvas effects input from visual state, scrub refs and derived data", () => {
    const result = buildSimpleMonitorDeckVisualCanvasEffectsInput({
      visualState: {
        waveformAnomalies: [],
        trackWaveProgress: 0.25,
        deckVisualPreset: "balanced",
        waveformScale: 1.3,
        safeRuntime: true,
      },
      scrub: {
        overviewCanvasRef: { current: null },
        waveformCanvasRef: { current: null },
        waveformStageRef: { current: null },
      },
      derived: {
        derivedDeckState: {
          overviewWaveSamples: [],
          overviewAnomalyDensity: [],
          anomalyBurstRegions: [],
          selectedDeckMarker: null,
          logWaveOverlay: [],
        },
        trackWaveSamples: [0.1, 0.2],
      },
    });

    expect(result.trackWaveProgress).toBe(0.25);
    expect(result.deckVisualPreset).toBe("balanced");
    expect(result.trackWaveSamples).toEqual([0.1, 0.2]);
  });

  it("builds the final visual state result by merging scrub and derived outputs", () => {
    const result = buildSimpleMonitorDeckVisualStateResult({
      scrub: {
        overviewCanvasRef: { current: null },
        waveformCanvasRef: { current: null },
      },
      derived: {
        visibleWindowSeconds: 8,
        trackWaveSamples: [0.4],
        deckTimelineMarkers: [1],
        deckBeatMarkers: [2],
        derivedDeckState: {
          overviewWindowLeftPercent: 10,
          selectedDeckMarker: null,
        },
      },
    });

    expect(result.visibleWindowSeconds).toBe(8);
    expect(result.trackWaveSamples).toEqual([0.4]);
    expect(result.overviewWindowLeftPercent).toBe(10);
  });
});
