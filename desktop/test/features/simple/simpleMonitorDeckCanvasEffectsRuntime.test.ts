import { describe, expect, it } from "vitest";

import { buildMonitorDeckCanvasEffectsPlans } from "../../../src/features/simple/simpleMonitorDeckCanvasEffectsRuntime";

describe("simpleMonitorDeckCanvasEffectsRuntime", () => {
  const derivedDeckState = {
    overviewWaveSamples: [0.1, 0.2],
    overviewAnomalyDensity: [0, 1],
    anomalyBurstRegions: [],
    selectedDeckMarker: null,
    logWaveOverlay: [0.2, 0.3],
  } as never;

  it("returns both render plans together from one input", () => {
    const result = buildMonitorDeckCanvasEffectsPlans({
      safeRuntime: false,
      overviewCanvas: {} as HTMLCanvasElement,
      waveformCanvas: {} as HTMLCanvasElement,
      waveformStage: {} as HTMLDivElement,
      derivedDeckState,
      waveformAnomalies: [],
      trackWaveSamples: [0.1, 0.2],
      trackWaveProgress: 0.3,
      deckVisualPreset: "alert",
    });

    expect(result.overviewPlan).toEqual(
      expect.objectContaining({
        canvas: expect.any(Object),
        visualPreset: "alert",
      }),
    );
    expect(result.waveformPlan).toEqual(
      expect.objectContaining({
        canvas: expect.any(Object),
        stage: expect.any(Object),
        trackWaveProgress: 0.3,
      }),
    );
  });

  it("returns null plans when safe runtime blocks rendering", () => {
    const result = buildMonitorDeckCanvasEffectsPlans({
      safeRuntime: true,
      overviewCanvas: {} as HTMLCanvasElement,
      waveformCanvas: {} as HTMLCanvasElement,
      waveformStage: {} as HTMLDivElement,
      derivedDeckState,
      waveformAnomalies: [],
      trackWaveSamples: [0.1, 0.2],
      trackWaveProgress: 0.3,
      deckVisualPreset: "balanced",
    });

    expect(result.overviewPlan).toBeNull();
    expect(result.waveformPlan).toBeNull();
  });
});
