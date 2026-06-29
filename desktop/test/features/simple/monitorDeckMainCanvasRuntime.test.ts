import { describe, expect, it } from "vitest";

import { buildMonitorDeckMainCanvasState } from "../../../src/features/simple/monitorDeckMainCanvasRuntime";

describe("monitorDeckMainCanvasRuntime", () => {
  it("builds palette, geometry and bounded log samples for the main deck canvas", () => {
    document.documentElement.setAttribute("data-skin", "arctic");

    const state = buildMonitorDeckMainCanvasState({
      stageWidth: 960,
      stageHeight: 240,
      devicePixelRatio: 2,
      visualPreset: "balanced",
      trackWaveSamples: [0.1, 0.4, 0.8],
      logWaveOverlay: [
        { level: 0, heat: 0, progress: 0 },
        { level: 0.5, heat: 0.6, progress: 0.5 },
      ],
    });

    expect(state.size).toEqual({ width: 960, height: 240, dpr: 2 });
    expect(state.layout.logBaseY).toBeGreaterThan(state.layout.trackBaseY);
    expect(state.logSamples[0]).toBe(0.04);
    expect(state.logSamples[1]).toBeGreaterThan(0.2);
    expect(state.palette.backgroundTop).toBeTruthy();
  });
});
