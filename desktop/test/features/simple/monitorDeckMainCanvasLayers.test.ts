import { beforeEach, describe, expect, it, vi } from "vitest";

const drawAnomalyWash = vi.fn();
const drawDeckBurstRegions = vi.fn();
const drawPhraseRibbon = vi.fn();
const drawQuantizedLogBlocks = vi.fn();
const drawSelectedMarkerBeam = vi.fn();
const drawSingleSidedWaveform = vi.fn();
const drawTrackEnergyBand = vi.fn();
const drawWaveContour = vi.fn();

vi.mock("../../../src/features/simple/monitorDeckCanvasDrawRuntime", () => ({
  drawAnomalyWash: (...args: unknown[]) => drawAnomalyWash(...args),
  drawDeckBurstRegions: (...args: unknown[]) => drawDeckBurstRegions(...args),
  drawPhraseRibbon: (...args: unknown[]) => drawPhraseRibbon(...args),
  drawQuantizedLogBlocks: (...args: unknown[]) => drawQuantizedLogBlocks(...args),
  drawSelectedMarkerBeam: (...args: unknown[]) => drawSelectedMarkerBeam(...args),
  drawSingleSidedWaveform: (...args: unknown[]) => drawSingleSidedWaveform(...args),
  drawTrackEnergyBand: (...args: unknown[]) => drawTrackEnergyBand(...args),
  drawWaveContour: (...args: unknown[]) => drawWaveContour(...args),
}));

import {
  drawMonitorDeckCanvasLayers,
  sizeMonitorDeckCanvas,
} from "../../../src/features/simple/monitorDeckMainCanvasLayers";
import type { MonitorDeckMainCanvasState } from "../../../src/features/simple/monitorDeckMainCanvasRuntime";
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
    stroke: vi.fn(),
    createLinearGradient: vi.fn(() => createGradient()),
    fillRect: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    globalAlpha: 0,
    globalCompositeOperation: "source-over",
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
      { level: 0.1, heat: 0.2 },
      { level: 0.4, heat: 0.5 },
    ],
  };
}

describe("monitorDeckMainCanvasLayers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sizes the canvas using css pixels and device pixel ratio", () => {
    const canvas = {
      width: 0,
      height: 0,
      style: { width: "", height: "" },
    } as HTMLCanvasElement;

    sizeMonitorDeckCanvas(canvas, { width: 640, height: 220, dpr: 1.5 });

    expect(canvas.width).toBe(960);
    expect(canvas.height).toBe(330);
    expect(canvas.style.width).toBe("640px");
    expect(canvas.style.height).toBe("220px");
  });

  it("draws the background, track lane, log lane and overlay composition in order", () => {
    const context = createContext();
    const state = createState();

    drawMonitorDeckCanvasLayers({
      context,
      state,
      width: 640,
      height: 220,
      anomalyBurstRegions: [{ startProgress: 0.48, endProgress: 0.54, severity: 0.8 }],
      selectedDeckMarker: {
        id: "marker-1",
        severity: 0.9,
        progress: 0.52,
        timestamp: "2026-06-29T12:00:02.000Z",
        message: "marker",
      },
      waveformAnomalies: [
        {
          id: "anomaly-1",
          lineId: "line-1",
          timestamp: "2026-06-29T12:00:02.000Z",
          message: "anomaly",
          severity: 0.9,
          progress: 0.52,
        },
      ],
      trackWaveProgress: 0.5,
    });

    expect(context.createLinearGradient).toHaveBeenCalled();
    expect(context.fillRect).toHaveBeenCalled();
    expect(drawTrackEnergyBand).toHaveBeenCalledWith(
      context,
      state.trackWaveSamples,
      640,
      expect.any(Number),
      expect.any(Number),
      state.palette,
    );
    expect(drawPhraseRibbon).toHaveBeenCalledWith(
      context,
      state.trackWaveSamples,
      640,
      expect.any(Number),
      expect.any(Number),
      state.palette,
    );
    expect(drawSingleSidedWaveform).toHaveBeenCalledTimes(3);
    expect(drawWaveContour).toHaveBeenCalledTimes(1);
    expect(context.beginPath).toHaveBeenCalledTimes(1);
    expect(context.stroke).toHaveBeenCalledTimes(1);
    expect(drawQuantizedLogBlocks).toHaveBeenCalledWith(
      context,
      state.logWaveOverlay,
      640,
      state.layout.logBaseY,
      expect.any(Number),
      state.palette,
      84,
    );
    expect(drawDeckBurstRegions).toHaveBeenCalledWith(
      expect.objectContaining({
        context,
        regions: [{ startProgress: 0.48, endProgress: 0.54, severity: 0.8 }],
        currentProgress: 0.5,
      }),
    );
    expect(drawAnomalyWash).toHaveBeenCalledWith(
      context,
      expect.arrayContaining([expect.objectContaining({ id: "anomaly-1" })]),
      0.5,
      640,
      state.layout.logBaseY,
      state.layout.logAmplitude,
      state.palette,
    );
    expect(drawSelectedMarkerBeam).toHaveBeenCalledWith(
      context,
      expect.objectContaining({ id: "marker-1" }),
      0.5,
      640,
      state.layout.headerInset,
      220 - state.layout.headerInset - state.layout.footerInset,
      state.palette,
    );
    expect(context.globalAlpha).toBe(1);
    expect(context.globalCompositeOperation).toBe("source-over");
  });
});
