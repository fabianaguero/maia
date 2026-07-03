import { describe, expect, it } from "vitest";

import { buildSimpleMonitorDeckVisualCanvasEffectsInput } from "../../../src/features/simple/simpleMonitorDeckVisualComposeRuntime";

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
});
