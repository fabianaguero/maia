import { describe, expect, it } from "vitest";

import {
  buildMonitorOverviewRenderPlan,
  buildMonitorWaveformRenderPlan,
} from "../../../src/features/simple/simpleMonitorDeckVisualStateRuntime";

describe("simpleMonitorDeckVisualStateRuntime", () => {
  const derivedDeckState = {
    overviewWaveSamples: [0.1, 0.2],
    overviewAnomalyDensity: [0, 1],
    anomalyBurstRegions: [],
    waveformAnomalies: [],
    selectedDeckMarker: null,
    logWaveOverlay: [0.2, 0.3],
  } as never;

  it("builds overview render plans only when canvas rendering is possible", () => {
    expect(
      buildMonitorOverviewRenderPlan({
        safeRuntime: true,
        canvas: {} as HTMLCanvasElement,
        derivedDeckState,
        waveformAnomalies: [],
        deckVisualPreset: "balanced",
      }),
    ).toBeNull();

    const plan = buildMonitorOverviewRenderPlan({
      safeRuntime: false,
      canvas: {} as HTMLCanvasElement,
      derivedDeckState,
      waveformAnomalies: [],
      deckVisualPreset: "balanced",
    });

    expect(plan).toEqual(
      expect.objectContaining({
        canvas: expect.any(Object),
        visualPreset: "balanced",
      }),
    );
  });

  it("builds waveform render plans only when canvas and stage are available", () => {
    expect(
      buildMonitorWaveformRenderPlan({
        safeRuntime: false,
        canvas: null,
        stage: {} as HTMLDivElement,
        trackWaveSamples: [0.1, 0.2],
        derivedDeckState,
        waveformAnomalies: [],
        trackWaveProgress: 0.2,
        deckVisualPreset: "alert",
      }),
    ).toBeNull();

    const plan = buildMonitorWaveformRenderPlan({
      safeRuntime: false,
      canvas: {} as HTMLCanvasElement,
      stage: {} as HTMLDivElement,
      trackWaveSamples: [0.1, 0.2],
      derivedDeckState,
      waveformAnomalies: [],
      trackWaveProgress: 0.2,
      deckVisualPreset: "alert",
    });

    expect(plan).toEqual(
      expect.objectContaining({
        canvas: expect.any(Object),
        stage: expect.any(Object),
        visualPreset: "alert",
        trackWaveProgress: 0.2,
      }),
    );
  });
});
