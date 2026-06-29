import { describe, expect, it } from "vitest";

import {
  resolveCurrentMonitorDeckSkin,
  resolveMonitorDeckPalette,
} from "../../../src/features/simple/monitorDeckCanvas";
import {
  buildMonitorDeckLayout,
  buildMonitorOverviewLayout,
  isMonitorDeckRelativePositionVisible,
  resolveMonitorDeckCanvasSize,
  resolveMonitorDeckRelativePosition,
  resolveMonitorDeckVisibleRange,
} from "../../../src/features/simple/monitorDeckCanvasRuntime";

describe("monitorDeckCanvas", () => {
  it("falls back to nightfall when no skin attribute is present", () => {
    document.documentElement.removeAttribute("data-skin");

    expect(resolveCurrentMonitorDeckSkin()).toBe("nightfall");
  });

  it("reads the active skin from the root attribute", () => {
    document.documentElement.setAttribute("data-skin", "copper");

    expect(resolveCurrentMonitorDeckSkin()).toBe("copper");
  });

  it("resolves distinct palettes per skin", () => {
    const nightfall = resolveMonitorDeckPalette("balanced", "nightfall");
    const arctic = resolveMonitorDeckPalette("balanced", "arctic");
    const copper = resolveMonitorDeckPalette("balanced", "copper");

    expect(arctic.backgroundTop).not.toBe(nightfall.backgroundTop);
    expect(arctic.centerLine).not.toBe(nightfall.centerLine);
    expect(copper.backgroundTop).not.toBe(nightfall.backgroundTop);
    expect(copper.trackGlow).not.toBe(nightfall.trackGlow);
  });

  it("builds stable canvas geometry for overview and deck stages", () => {
    expect(resolveMonitorDeckCanvasSize({ width: 640.8, height: 180.4, dpr: 2 })).toEqual({
      width: 640,
      height: 180,
      dpr: 2,
    });

    const overview = buildMonitorOverviewLayout(640, 90);
    expect(overview.trackFloorY).toBeGreaterThan(14);
    expect(overview.anomalyBandTop).toBeGreaterThan(overview.trackFloorY);

    const deck = buildMonitorDeckLayout(960, 240);
    expect(deck.headerInset).toBeGreaterThanOrEqual(46);
    expect(deck.logBaseY).toBeGreaterThan(deck.trackBaseY);
    expect(deck.centerBandHeight).toBeGreaterThanOrEqual(2);
  });

  it("resolves relative deck positions and visible burst windows", () => {
    const relative = resolveMonitorDeckRelativePosition(0.52, 0.5);
    expect(relative).toBeGreaterThan(0.5);
    expect(isMonitorDeckRelativePositionVisible(relative)).toBe(true);
    expect(isMonitorDeckRelativePositionVisible(-0.2)).toBe(false);

    const visible = resolveMonitorDeckVisibleRange({
      startProgress: 0.48,
      endProgress: 0.56,
      currentProgress: 0.5,
      width: 1000,
    });
    expect(visible.isVisible).toBe(true);
    expect(visible.visibleWidth).toBeGreaterThan(0);

    const hidden = resolveMonitorDeckVisibleRange({
      startProgress: 0,
      endProgress: 0.04,
      currentProgress: 0.8,
      width: 1000,
    });
    expect(hidden.isVisible).toBe(false);
  });
});
