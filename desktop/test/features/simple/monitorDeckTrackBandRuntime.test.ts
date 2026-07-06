import { describe, expect, it, vi } from "vitest";

const drawTrackEnergyBand = vi.fn();
const drawPhraseRibbon = vi.fn();
const fillVerticalGradientRect = vi.fn();

vi.mock("../../../src/features/simple/monitorDeckCanvasDrawRuntime", () => ({
  drawTrackEnergyBand: (...args: unknown[]) => drawTrackEnergyBand(...args),
  drawPhraseRibbon: (...args: unknown[]) => drawPhraseRibbon(...args),
}));

vi.mock("../../../src/features/simple/monitorDeckCanvasGradientRuntime", () => ({
  fillVerticalGradientRect: (...args: unknown[]) => fillVerticalGradientRect(...args),
}));

import { drawMonitorDeckTrackBand } from "../../../src/features/simple/monitorDeckTrackBandRuntime";
import type { MonitorDeckMainCanvasState } from "../../../src/features/simple/monitorDeckMainCanvasRuntime";

describe("monitorDeckTrackBandRuntime", () => {
  it("draws the track glow, energy band and phrase ribbon", () => {
    const context = {} as CanvasRenderingContext2D;
    const state = {
      palette: { id: "palette" },
      trackWaveSamples: [0.2, 0.5, 0.8],
    } as unknown as MonitorDeckMainCanvasState;
    const scene = {
      track: {
        glowRect: { x: 0, y: 0, width: 1, height: 1 },
        glowStops: ["a"],
        energyBandTopY: 10,
        energyBandHeight: 20,
        phraseRibbonTopY: 30,
        phraseRibbonHeight: 12,
      },
    } as never;

    drawMonitorDeckTrackBand(context, state, 640, scene);

    expect(fillVerticalGradientRect).toHaveBeenCalledWith(
      context,
      scene.track.glowRect,
      scene.track.glowStops,
    );
    expect(drawTrackEnergyBand).toHaveBeenCalledWith(
      context,
      state.trackWaveSamples,
      640,
      10,
      20,
      state.palette,
    );
    expect(drawPhraseRibbon).toHaveBeenCalledWith(
      context,
      state.trackWaveSamples,
      640,
      30,
      12,
      state.palette,
    );
  });
});
