import { beforeEach, describe, expect, it, vi } from "vitest";

const { drawSingleSidedWaveform, drawWaveContour } = vi.hoisted(() => ({
  drawSingleSidedWaveform: vi.fn(),
  drawWaveContour: vi.fn(),
}));

vi.mock("../../../src/features/simple/monitorDeckCanvasDrawRuntime", () => ({
  drawSingleSidedWaveform,
  drawWaveContour,
}));

import { renderMonitorOverviewCanvas } from "../../../src/features/simple/monitorDeckOverviewCanvas";

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
    fillStyle: "",
  };
}

describe("monitorDeckOverviewCanvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.setAttribute("data-skin", "nightfall");
  });

  it("sizes the canvas and returns early when no 2d context is available", () => {
    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "clientWidth", { value: 640, configurable: true });
    Object.defineProperty(canvas, "clientHeight", { value: 90, configurable: true });
    vi.spyOn(canvas, "getContext").mockReturnValue(null);

    renderMonitorOverviewCanvas({
      canvas,
      overviewWaveSamples: [0.1, 0.3, 0.6],
      overviewAnomalyDensity: [],
      anomalyBurstRegions: [],
      waveformAnomalies: [],
      selectedDeckMarker: null,
    });

    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
    expect(drawSingleSidedWaveform).not.toHaveBeenCalled();
    expect(drawWaveContour).not.toHaveBeenCalled();
  });

  it("renders overview waveform, anomaly density, burst regions, markers, and playhead beam", () => {
    const canvas = document.createElement("canvas");
    const context = createContext();
    Object.defineProperty(canvas, "clientWidth", { value: 720, configurable: true });
    Object.defineProperty(canvas, "clientHeight", { value: 96, configurable: true });
    vi.spyOn(canvas, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);

    renderMonitorOverviewCanvas({
      canvas,
      overviewWaveSamples: [0.08, 0.22, 0.4, 0.72, 0.33],
      overviewAnomalyDensity: [
        { warning: 0.4, critical: 0 },
        { warning: 0, critical: 0.8 },
      ],
      anomalyBurstRegions: [
        { startProgress: 0.2, endProgress: 0.26, severity: 0.7 },
        { startProgress: 0.4, endProgress: 0.48, severity: 0.95 },
      ],
      waveformAnomalies: [
        { id: "warn-1", progress: 0.34, severity: 0.5, label: "warn" },
        { id: "crit-1", progress: 0.58, severity: 0.95, label: "error" },
      ],
      selectedDeckMarker: { id: "marker-1", progress: 0.46, label: "playhead" },
      visualPreset: "alert",
    });

    expect(context.setTransform).toHaveBeenCalled();
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 720, 96);
    expect(context.createLinearGradient).toHaveBeenCalledTimes(5);
    expect(context.fillRect).toHaveBeenCalled();
    expect(drawSingleSidedWaveform).toHaveBeenCalledTimes(1);
    expect(drawWaveContour).toHaveBeenCalledTimes(1);
    expect(drawSingleSidedWaveform).toHaveBeenCalledWith(
      context,
      [0.08, 0.22, 0.4, 0.72, 0.33],
      720,
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ addColorStop: expect.any(Function) }),
    );
    expect(drawWaveContour).toHaveBeenCalledWith(
      context,
      [0.08, 0.22, 0.4, 0.72, 0.33],
      720,
      expect.any(Number),
      expect.any(Number),
      expect.any(String),
      1,
      "top",
    );
  });
});
