import { describe, expect, it, vi } from "vitest";

import {
  drawAnomalyWash,
  drawDeckBurstRegions,
  drawPhraseRibbon,
  drawQuantizedLogBlocks,
  drawSelectedMarkerBeam,
  drawSingleSidedWaveform,
  drawTrackEnergyBand,
  drawWaveContour,
} from "../../../src/features/simple/monitorDeckCanvasDrawRuntime";
import type { MonitorDeckPalette } from "../../../src/features/simple/monitorDeckCanvasPalette";

function createGradient() {
  return {
    addColorStop: vi.fn(),
  };
}

function createContext() {
  return {
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => createGradient()),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D;
}

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

describe("monitorDeckCanvasDrawRuntime", () => {
  it("draws waveform fills and contours while bailing out on empty samples", () => {
    const context = createContext();

    drawSingleSidedWaveform(context, [], 320, 80, 20, "#0cf");
    drawWaveContour(context, [], 320, 80, 20, "#fff", 2, "top");

    expect(context.beginPath).not.toHaveBeenCalled();

    drawSingleSidedWaveform(context, [0.1, 0.4, 0.8], 300, 90, 30, "#0cf");
    drawWaveContour(context, [0.1, 0.4, 0.8], 300, 90, 30, "#fff", 2, "bottom");

    expect(context.beginPath).toHaveBeenCalledTimes(2);
    expect(context.moveTo).toHaveBeenCalled();
    expect(context.lineTo).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalledTimes(1);
    expect(context.fill).toHaveBeenCalledTimes(1);
    expect(context.stroke).toHaveBeenCalledTimes(1);
  });

  it("renders phrase ribbons and track bands across cool, mid, warm, and hot energy branches", () => {
    const context = createContext();
    const palette = createPalette();
    const sparse = [0.1, 0.12, 0.18, 0.2];
    const mixed = [0.3, 0.45, 0.62, 0.88];

    drawPhraseRibbon(context, [], 400, 10, 24, palette, 8);
    drawTrackEnergyBand(context, [], 400, 20, 40, palette, 8);

    expect(context.fillRect).not.toHaveBeenCalled();

    drawPhraseRibbon(context, sparse, 400, 10, 24, palette, 4);
    drawPhraseRibbon(context, mixed, 400, 10, 24, palette, 4);
    drawTrackEnergyBand(context, sparse, 400, 20, 40, palette, 4);
    drawTrackEnergyBand(context, mixed, 400, 20, 40, palette, 4);

    expect(context.fillRect).toHaveBeenCalled();
    expect(context.createLinearGradient).toHaveBeenCalled();
  });

  it("draws quantized log blocks and hot overlays while ignoring invalid dimensions", () => {
    const context = createContext();
    const palette = createPalette();

    drawQuantizedLogBlocks(context, [{ level: 0.5, heat: 0.8 }], Number.NaN, 120, 40, palette, 4);
    expect(context.fillRect).not.toHaveBeenCalled();

    drawQuantizedLogBlocks(
      context,
      [
        { level: 0.1, heat: 0.1 },
        { level: 0.4, heat: 0.4 },
        { level: 0.8, heat: 0.9 },
      ],
      320,
      120,
      40,
      palette,
      3,
    );

    expect(context.fillRect).toHaveBeenCalled();
    expect((context.fillRect as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(3);
  });

  it("draws visible anomaly washes and selected marker beams while skipping hidden markers", () => {
    const context = createContext();
    const palette = createPalette();

    drawAnomalyWash(context, [], 0.5, 400, 120, 40, palette);
    drawSelectedMarkerBeam(context, null, 0.5, 400, 10, 180, palette);
    expect(context.createLinearGradient).not.toHaveBeenCalled();

    drawAnomalyWash(
      context,
      [
        {
          id: "hidden",
          lineId: "line-hidden",
          timestamp: "2026-06-29T12:00:00.000Z",
          message: "hidden",
          severity: 0.4,
          progress: 0,
        },
        {
          id: "warn",
          lineId: "line-warn",
          timestamp: "2026-06-29T12:00:01.000Z",
          message: "warn",
          severity: 0.6,
          progress: 0.5,
        },
        {
          id: "crit",
          lineId: "line-crit",
          timestamp: "2026-06-29T12:00:02.000Z",
          message: "crit",
          severity: 0.95,
          progress: 0.54,
        },
      ],
      0.5,
      400,
      120,
      40,
      palette,
    );

    drawSelectedMarkerBeam(
      context,
      {
        id: "marker-crit",
        severity: 0.95,
        progress: 0.52,
        timestamp: "2026-06-29T12:00:02.000Z",
        message: "crit",
      },
      0.5,
      400,
      10,
      180,
      palette,
    );

    expect(context.createLinearGradient).toHaveBeenCalled();
    expect(context.fillRect).toHaveBeenCalled();
  });

  it("draws visible burst regions for warning and error severities only when on screen", () => {
    const context = createContext();
    const palette = createPalette();

    drawDeckBurstRegions({
      context,
      regions: [
        { startProgress: 0, endProgress: 0.02, severity: 0.7 },
        { startProgress: 0.48, endProgress: 0.54, severity: 0.7 },
        { startProgress: 0.52, endProgress: 0.58, severity: 0.95 },
      ],
      currentProgress: 0.5,
      width: 640,
      logBaseY: 150,
      logAmplitude: 36,
      palette,
    });

    expect(context.createLinearGradient).toHaveBeenCalledTimes(2);
    expect(context.fillRect).toHaveBeenCalledTimes(2);
  });
});
