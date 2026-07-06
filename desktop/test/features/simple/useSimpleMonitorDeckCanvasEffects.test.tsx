import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSimpleMonitorDeckCanvasEffects } from "../../../src/features/simple/useSimpleMonitorDeckCanvasEffects";

const state = vi.hoisted(() => ({
  renderMonitorOverviewCanvas: vi.fn(),
  renderMonitorDeckCanvas: vi.fn(),
}));

vi.mock("../../../src/features/simple/monitorDeckCanvas", async () => {
  const actual = await vi.importActual("../../../src/features/simple/monitorDeckCanvas");
  return {
    ...actual,
    renderMonitorOverviewCanvas: state.renderMonitorOverviewCanvas,
    renderMonitorDeckCanvas: state.renderMonitorDeckCanvas,
  };
});

describe("useSimpleMonitorDeckCanvasEffects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips both canvas renderers in safe runtime", () => {
    renderHook(() =>
      useSimpleMonitorDeckCanvasEffects({
        overviewCanvasRef: { current: null },
        waveformCanvasRef: { current: null },
        waveformStageRef: { current: null },
        derivedDeckState: {
          overviewWaveSamples: [0.2, 0.3],
          overviewAnomalyDensity: [{ warning: 0.2, critical: 0 }],
          anomalyBurstRegions: [],
          selectedDeckMarker: null,
          logWaveOverlay: [{ progress: 0.2, level: 0.3, heat: 0.2 }],
        },
        waveformAnomalies: [],
        trackWaveSamples: [0.2, 0.3, 0.4],
        trackWaveProgress: 0.25,
        deckVisualPreset: "balanced",
        waveformScale: 1,
        safeRuntime: true,
      }),
    );

    expect(state.renderMonitorOverviewCanvas).not.toHaveBeenCalled();
    expect(state.renderMonitorDeckCanvas).not.toHaveBeenCalled();
  });
});
