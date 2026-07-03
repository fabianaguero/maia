import { describe, expect, it } from "vitest";

import type { MonitorDeckPalette } from "../../../src/features/simple/monitorDeckCanvasPalette";
import {
  buildMonitorDeckAnomalyWashPlans,
  buildMonitorDeckBurstRegionPlans,
  buildMonitorDeckSelectedMarkerBeamPlan,
} from "../../../src/features/simple/monitorDeckCanvasOverlayRuntime";

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

describe("monitorDeckCanvasOverlayRuntime", () => {
  it("builds only visible anomaly wash plans with scaled geometry", () => {
    const plans = buildMonitorDeckAnomalyWashPlans({
      markers: [
        {
          id: "hidden",
          lineId: "line-hidden",
          timestamp: "2026-06-29T12:00:00.000Z",
          message: "hidden",
          severity: 0.5,
          progress: 0,
        },
        {
          id: "visible",
          lineId: "line-visible",
          timestamp: "2026-06-29T12:00:01.000Z",
          message: "visible",
          severity: 0.95,
          progress: 0.52,
        },
      ],
      currentProgress: 0.5,
      width: 400,
      amplitudeScale: 40,
      palette: createPalette(),
    });

    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({
      markerId: "visible",
      severity: 0.95,
      accentColor: "rgba(255,72,108,0.62)",
    });
    expect(plans[0]!.x).toBeGreaterThan(200);
    expect(plans[0]!.zoneHeight).toBeGreaterThan(30);
  });

  it("builds the selected marker beam only when the marker is visible", () => {
    const palette = createPalette();

    expect(
      buildMonitorDeckSelectedMarkerBeamPlan({
        marker: null,
        currentProgress: 0.5,
        width: 400,
        palette,
      }),
    ).toBeNull();

    const plan = buildMonitorDeckSelectedMarkerBeamPlan({
      marker: {
        id: "marker-1",
        severity: 0.7,
        progress: 0.52,
        timestamp: "2026-06-29T12:00:02.000Z",
        message: "marker",
      },
      currentProgress: 0.5,
      width: 400,
      palette,
    });

    expect(plan).toMatchObject({
      markerId: "marker-1",
      glowColor: "#fd8",
      beamColor: "#fc0",
      beamWidth: 44,
      lineWidth: 2,
    });
  });

  it("builds visible burst regions with derived vertical bounds", () => {
    const plans = buildMonitorDeckBurstRegionPlans({
      regions: [
        { startProgress: 0, endProgress: 0.02, severity: 0.7 },
        { startProgress: 0.48, endProgress: 0.54, severity: 0.7 },
        { startProgress: 0.52, endProgress: 0.58, severity: 0.95 },
      ],
      currentProgress: 0.5,
      width: 640,
      logBaseY: 150,
      logAmplitude: 36,
      palette: createPalette(),
    });

    expect(plans).toHaveLength(2);
    expect(plans[0]!.topY).toBeCloseTo(116.88);
    expect(plans[0]!.height).toBeCloseTo(36.72);
    expect(plans[1]!.topColor).toBe("rgba(255,72,108,0.62)");
  });
});
