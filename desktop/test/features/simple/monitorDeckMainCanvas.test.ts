import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  drawAnomalyWash,
  drawDeckBurstRegions,
  drawPhraseRibbon,
  drawQuantizedLogBlocks,
  drawRekordboxWaveformBars,
  drawSelectedMarkerBeam,
  drawSingleSidedWaveform,
  drawTrackEnergyBand,
  drawWaveContour,
  buildMonitorDeckMainCanvasState,
} = vi.hoisted(() => ({
  drawAnomalyWash: vi.fn(),
  drawDeckBurstRegions: vi.fn(),
  drawPhraseRibbon: vi.fn(),
  drawQuantizedLogBlocks: vi.fn(),
  drawRekordboxWaveformBars: vi.fn(),
  drawSelectedMarkerBeam: vi.fn(),
  drawSingleSidedWaveform: vi.fn(),
  drawTrackEnergyBand: vi.fn(),
  drawWaveContour: vi.fn(),
  buildMonitorDeckMainCanvasState: vi.fn(),
}));

vi.mock("../../../src/features/simple/monitorDeckCanvasDrawRuntime", () => ({
  drawAnomalyWash,
  drawDeckBurstRegions,
  drawPhraseRibbon,
  drawQuantizedLogBlocks,
  drawRekordboxWaveformBars,
  drawSelectedMarkerBeam,
  drawSingleSidedWaveform,
  drawTrackEnergyBand,
  drawWaveContour,
}));

vi.mock("../../../src/features/simple/monitorDeckMainCanvasRuntime", () => ({
  buildMonitorDeckMainCanvasState,
}));

import { renderMonitorDeckCanvas } from "../../../src/features/simple/monitorDeckMainCanvas";

function createGradient() {
  return {
    addColorStop: vi.fn(),
  };
}

function createContext() {
  return {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    createLinearGradient: vi.fn(() => createGradient()),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
  };
}

function mockCanvasState() {
  buildMonitorDeckMainCanvasState.mockReturnValue({
    palette: {
      backgroundTop: "#000111",
      backgroundMid: "#111222",
      backgroundBottom: "#222333",
      separatorLine: "#333",
      trackGlow: "rgba(0, 255, 255, 0.3)",
      logGlowTop: "rgba(255, 128, 0, 0.1)",
      logGlowMid: "rgba(255, 96, 0, 0.18)",
      logGlowBottom: "rgba(64, 196, 255, 0.08)",
      centerLine: "rgba(255,255,255,0.08)",
      trackTopCool: "#9fd7ff",
      trackBottomCool: "#4ab8ff",
      playheadCore: "#ffffff",
      logWarm: "#ffbf4d",
      logCool: "#5ad8ff",
      logHot: "#ff5f6d",
      contourStroke: "#d7f1ff",
      playheadGlow: "rgba(255,255,255,0.5)",
    },
    size: {
      width: 800,
      height: 240,
      dpr: 2,
    },
    layout: {
      headerInset: 12,
      footerInset: 18,
      deckHeight: 160,
      trackBaseY: 72,
      trackAmplitude: 28,
      logBaseY: 156,
      logAmplitude: 36,
      separatorY: 118,
      centerBandHeight: 8,
    },
    logSamples: [0.12, 0.28, 0.44],
    logWaveOverlay: [],
  });
}

describe("monitorDeckMainCanvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanvasState();
  });

  it("returns early when no 2d context is available but still sizes the canvas", () => {
    const canvas = document.createElement("canvas");
    const stage = document.createElement("div");
    Object.defineProperty(stage, "clientWidth", { value: 800 });
    Object.defineProperty(stage, "clientHeight", { value: 240 });
    vi.spyOn(canvas, "getContext").mockReturnValue(null);

    renderMonitorDeckCanvas({
      canvas,
      stage,
      trackWaveSamples: [0.1, 0.4],
      logWaveOverlay: [],
      anomalyBurstRegions: [],
      selectedDeckMarker: null,
      waveformAnomalies: [],
      trackWaveProgress: 0.5,
    });

    expect(buildMonitorDeckMainCanvasState).toHaveBeenCalledTimes(1);
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(480);
    expect(canvas.style.width).toBe("800px");
    expect(canvas.style.height).toBe("240px");
    expect(drawTrackEnergyBand).not.toHaveBeenCalled();
  });

  it("renders the main deck using the prepared runtime state and draw delegates", () => {
    const canvas = document.createElement("canvas");
    const stage = document.createElement("div");
    const context = createContext();
    Object.defineProperty(stage, "clientWidth", { value: 800 });
    Object.defineProperty(stage, "clientHeight", { value: 240 });
    vi.spyOn(canvas, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);

    renderMonitorDeckCanvas({
      canvas,
      stage,
      trackWaveSamples: [0.1, 0.4, 0.8],
      logWaveOverlay: [{ progress: 0.5, level: 0.6, heat: 0.7 }],
      anomalyBurstRegions: [{ startProgress: 0.45, endProgress: 0.55, severity: 0.8 }],
      selectedDeckMarker: { id: "marker-1", progress: 0.5, label: "Deploy spike" },
      waveformAnomalies: [{ id: "a-1", progress: 0.52, severity: 0.9, label: "Error burst" }],
      trackWaveProgress: 0.5,
      visualPreset: "balanced",
    });

    expect(context.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 800, 240);
    expect(drawTrackEnergyBand).not.toHaveBeenCalled();
    expect(drawPhraseRibbon).not.toHaveBeenCalled();
    expect(drawSingleSidedWaveform).toHaveBeenCalledTimes(2);
    expect(drawRekordboxWaveformBars).toHaveBeenCalledTimes(2);
    expect(drawQuantizedLogBlocks).not.toHaveBeenCalled();
    expect(drawDeckBurstRegions).toHaveBeenCalledTimes(1);
    expect(drawAnomalyWash).toHaveBeenCalledTimes(1);
    expect(drawSelectedMarkerBeam).toHaveBeenCalledTimes(1);
    expect(drawWaveContour).toHaveBeenCalledTimes(2);
    expect(buildMonitorDeckMainCanvasState).toHaveBeenCalledWith({
      stageWidth: 800,
      stageHeight: 240,
      devicePixelRatio: window.devicePixelRatio || 1,
      visualPreset: "balanced",
      trackWaveSamples: [0.1, 0.4, 0.8],
      logWaveOverlay: [{ progress: 0.5, level: 0.6, heat: 0.7 }],
    });
  });
});
