import { describe, expect, it } from "vitest";

import {
  resolveOverviewViewportSeekProgress,
  resolveStageViewportSeekProgress,
} from "../../../src/features/simple/monitorDeckScrubViewportRuntime";

describe("monitorDeckScrubViewportRuntime", () => {
  it("returns null when the overview canvas is missing", () => {
    expect(
      resolveOverviewViewportSeekProgress({
        canvas: null,
        clientX: 120,
      }),
    ).toBeNull();
  });

  it("resolves overview scrub progress from the canvas viewport", () => {
    const progress = resolveOverviewViewportSeekProgress({
      canvas: {
        getBoundingClientRect: () => ({ left: 20, width: 200 }) as DOMRect,
      } as Pick<HTMLCanvasElement, "getBoundingClientRect">,
      clientX: 120,
    });

    expect(progress).toBe(0.5);
  });

  it("returns null when the deck stage is missing", () => {
    expect(
      resolveStageViewportSeekProgress({
        stage: null,
        clientX: 120,
        startRatio: 0.5,
        startProgress: 0.25,
      }),
    ).toBeNull();
  });

  it("resolves deck scrub progress from the stage viewport and scrub anchors", () => {
    const progress = resolveStageViewportSeekProgress({
      stage: {
        getBoundingClientRect: () => ({ left: 100, width: 400 }) as DOMRect,
      } as Pick<HTMLDivElement, "getBoundingClientRect">,
      clientX: 320,
      startRatio: 0.5,
      startProgress: 0.25,
    });

    expect(progress).not.toBeNull();
    expect(progress!).toBeGreaterThanOrEqual(0);
    expect(progress!).toBeLessThanOrEqual(1);
  });
});
