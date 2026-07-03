import { describe, expect, it, vi } from "vitest";

const drawSingleSidedWaveform = vi.fn();
const drawWaveContour = vi.fn();
const createVerticalGradient = vi.fn(() => ({ addColorStop: vi.fn() }));

vi.mock("../../../src/features/simple/monitorDeckCanvasDrawRuntime", () => ({
  drawSingleSidedWaveform: (...args: unknown[]) => drawSingleSidedWaveform(...args),
  drawWaveContour: (...args: unknown[]) => drawWaveContour(...args),
}));

vi.mock("../../../src/features/simple/monitorDeckCanvasGradientRuntime", () => ({
  createVerticalGradient: (...args: unknown[]) => createVerticalGradient(...args),
}));

import { drawMonitorDeckTrackWave } from "../../../src/features/simple/monitorDeckTrackWaveRuntime";
import type { MonitorDeckMainCanvasState } from "../../../src/features/simple/monitorDeckMainCanvasRuntime";

describe("monitorDeckTrackWaveRuntime", () => {
  it("draws main wave, gloss pass and contour while restoring composite mode", () => {
    const context = {
      globalAlpha: 0,
      globalCompositeOperation: "source-over",
    } as CanvasRenderingContext2D;
    const state = {
      palette: { contourStroke: "#def" },
      layout: { trackBaseY: 82, trackAmplitude: 28 },
      trackWaveSamples: [0.2, 0.5, 0.8],
    } as unknown as MonitorDeckMainCanvasState;
    const scene = {
      track: {
        fillStops: ["fill"],
        glossAmplitudeScale: 0.5,
        glossStops: ["gloss"],
      },
    } as never;

    drawMonitorDeckTrackWave(context, state, 640, scene);

    expect(createVerticalGradient).toHaveBeenCalledTimes(2);
    expect(drawSingleSidedWaveform).toHaveBeenCalledTimes(2);
    expect(drawWaveContour).toHaveBeenCalledWith(
      context,
      state.trackWaveSamples,
      640,
      82,
      28,
      "#def",
      1.4,
      "top",
    );
    expect(context.globalCompositeOperation).toBe("source-over");
  });
});
