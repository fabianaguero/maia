import { describe, expect, it } from "vitest";

import {
  buildMonitorDeckQuantizedLogBlockMetrics,
  buildMonitorDeckSampleWindowMetrics,
  resolveMonitorDeckPhraseRibbonColor,
  resolveMonitorDeckTrackBandColors,
} from "../../../src/features/simple/monitorDeckCanvasDrawMetricsRuntime";
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

describe("monitorDeckCanvasDrawMetricsRuntime", () => {
  it("aggregates sample windows and derives phrase/track colors from energy", () => {
    const palette = createPalette();
    const metrics = buildMonitorDeckSampleWindowMetrics([0.1, 0.5, 0.9], 1, 3, (avg, peak) =>
      Math.max(avg, peak * 0.82),
    );

    expect(metrics.avg).toBeGreaterThan(0);
    expect(metrics.peak).toBe(0.5);
    expect(resolveMonitorDeckPhraseRibbonColor(palette, 0.2)).toBe(palette.phraseCool);
    expect(resolveMonitorDeckPhraseRibbonColor(palette, 0.85)).toBe(palette.phraseHot);
    expect(resolveMonitorDeckTrackBandColors(palette, 0.1)).toEqual({
      colorTop: palette.trackTopCool,
      colorBottom: palette.trackBottomCool,
    });
    expect(resolveMonitorDeckTrackBandColors(palette, 0.9)).toEqual({
      colorTop: palette.trackTopHot,
      colorBottom: palette.trackBottomHot,
    });
  });

  it("builds quantized log block metrics with heat-aware fill styles", () => {
    const palette = createPalette();
    const coolMetrics = buildMonitorDeckQuantizedLogBlockMetrics({
      samples: [{ level: 0.2, heat: 0.1 }],
      step: 0,
      steps: 1,
      amplitudeScale: 40,
      palette,
    });
    const hotMetrics = buildMonitorDeckQuantizedLogBlockMetrics({
      samples: [{ level: 0.8, heat: 0.9 }],
      step: 0,
      steps: 1,
      amplitudeScale: 40,
      palette,
    });

    expect(coolMetrics?.fillStyle).toBe(palette.logCool);
    expect(coolMetrics?.hasHotOverlay).toBe(false);
    expect(hotMetrics?.fillStyle).toBe(palette.logHot);
    expect(hotMetrics?.hasHotOverlay).toBe(true);
  });
});
