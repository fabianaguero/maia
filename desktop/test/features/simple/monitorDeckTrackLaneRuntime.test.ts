import { describe, expect, it, vi } from "vitest";

const drawMonitorDeckTrackBand = vi.fn();
const drawMonitorDeckTrackWave = vi.fn();

vi.mock("../../../src/features/simple/monitorDeckTrackBandRuntime", () => ({
  drawMonitorDeckTrackBand: (...args: unknown[]) => drawMonitorDeckTrackBand(...args),
}));

vi.mock("../../../src/features/simple/monitorDeckTrackWaveRuntime", () => ({
  drawMonitorDeckTrackWave: (...args: unknown[]) => drawMonitorDeckTrackWave(...args),
}));

import { drawMonitorDeckTrackLane } from "../../../src/features/simple/monitorDeckTrackLaneRuntime";
import type { MonitorDeckMainCanvasState } from "../../../src/features/simple/monitorDeckMainCanvasRuntime";
import type { MonitorDeckPalette } from "../../../src/features/simple/monitorDeckCanvasPalette";

function createPalette(): MonitorDeckPalette {
  return {
    backgroundTop: "#001",
    backgroundMid: "#112",
    backgroundBottom: "#223",
    separatorLine: "#334",
    trackGlow: "#445",
    overviewBaseGlow: "#556",
    overviewFillStops: [],
    phraseCool: "#0cf",
    phraseMid: "#9f0",
    phraseWarm: "#fc0",
    phraseHot: "#f60",
    trackTopCool: "#9df",
    trackBottomCool: "#5af",
    trackTopMid: "#af8",
    trackBottomMid: "#7cc",
    trackTopWarm: "#fd8",
    trackBottomWarm: "#fa8",
    trackTopHot: "#f97",
    trackBottomHot: "#f48",
    centerLine: "#fff",
    logGlowTop: "#111",
    logGlowMid: "#222",
    logGlowBottom: "#333",
    logCool: "#4af",
    logWarm: "#fc0",
    logHot: "#f66",
    anomalyWarn: "rgba(255,196,92,0.56)",
    anomalyWarnSoft: "rgba(255,196,92,0.16)",
    anomalyError: "rgba(255,72,108,0.62)",
    anomalyErrorSoft: "rgba(255,72,108,0.2)",
    burstWarn: "#fc0",
    burstError: "#f36",
    contourStroke: "#def",
    playheadGlow: "#fff",
    playheadCore: "rgba(255,255,255,0.92)",
    markerWarnGlow: "#fd8",
    markerErrorGlow: "#f68",
    markerWarnBeam: "#fc0",
    markerErrorBeam: "#f36",
  };
}

function createState(): MonitorDeckMainCanvasState {
  return {
    palette: createPalette(),
    size: { width: 640, height: 220, dpr: 2 },
    layout: {
      headerInset: 20,
      footerInset: 18,
      separatorY: 96,
      logBaseY: 180,
      centerBandHeight: 8,
      deckHeight: 90,
      trackBaseY: 82,
      trackAmplitude: 28,
      logAmplitude: 34,
    },
    logSamples: [0.1, 0.4, 0.7],
    trackWaveSamples: [0.2, 0.5, 0.8],
    logWaveOverlay: [],
  };
}

describe("monitorDeckTrackLaneRuntime", () => {
  it("delegates track rendering to band and wave runtimes", () => {
    const context = {} as CanvasRenderingContext2D;
    const state = createState();
    const scene = {
      track: {
        glowRect: { x: 0, y: 0, width: 1, height: 1 },
        glowStops: [],
        energyBandTopY: 1,
        energyBandHeight: 2,
        phraseRibbonTopY: 3,
        phraseRibbonHeight: 4,
        fillStops: [],
        glossAmplitudeScale: 0.5,
        glossStops: [],
      },
    } as never;

    drawMonitorDeckTrackLane(context, state, 640, scene);

    expect(drawMonitorDeckTrackBand).toHaveBeenCalledWith(context, state, 640, scene);
    expect(drawMonitorDeckTrackWave).toHaveBeenCalledWith(context, state, 640, scene);
  });
});
