import { describe, expect, it } from "vitest";

import type { MonitorDeckPalette } from "../../../src/features/simple/monitorDeckCanvasPalette";
import {
  buildMonitorDeckCanvasScenePlan,
  buildMonitorDeckLogContourPoints,
} from "../../../src/features/simple/monitorDeckMainCanvasSceneRuntime";
import type { MonitorDeckMainCanvasState } from "../../../src/features/simple/monitorDeckMainCanvasRuntime";

function createPalette(): MonitorDeckPalette {
  return {
    backgroundTop: "#001",
    backgroundMid: "#112",
    backgroundBottom: "#223",
    separatorLine: "#334",
    trackGlow: "rgba(68,85,102,0.4)",
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
    logWaveOverlay: [
      { progress: 0.2, level: 0.1, heat: 0.2 },
      { progress: 0.5, level: 0.4, heat: 0.5 },
    ],
  };
}

describe("monitorDeckMainCanvasSceneRuntime", () => {
  it("builds a stable scene plan for the main canvas lanes", () => {
    const plan = buildMonitorDeckCanvasScenePlan({
      state: createState(),
      width: 640,
      height: 220,
    });

    expect(plan.background.headerSeparator).toEqual({
      x: 0,
      y: 19,
      width: 640,
      height: 1,
    });
    expect(plan.background.playheadColumn.x).toBe(319);
    expect(plan.track.energyBandTopY).toBeGreaterThan(20);
    expect(plan.track.phraseRibbonHeight).toBeGreaterThanOrEqual(12);
    expect(plan.log.quantizedBlockAmplitudeScale).toBe(0.96);
    expect(plan.log.contourPoints).toHaveLength(3);
    expect(plan.overlay.playheadGlowRect.width).toBe(36);
  });

  it("maps contour points across the full visible width", () => {
    const points = buildMonitorDeckLogContourPoints({
      samples: [0.1, 0.4, 0.7],
      width: 300,
      baseY: 120,
      amplitude: 50,
    });

    expect(points[0]).toEqual({ x: 0, y: 115 });
    expect(points[1]).toEqual({ x: 150, y: 100 });
    expect(points[2]).toEqual({ x: 300, y: 85 });
  });
});
