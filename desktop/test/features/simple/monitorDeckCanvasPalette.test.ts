import { afterEach, describe, expect, it, vi } from "vitest";

import {
  resolveCurrentMonitorDeckSkin,
  resolveMonitorDeckPalette,
  withAlpha,
} from "../../../src/features/simple/monitorDeckCanvasPalette";

describe("monitorDeckCanvasPalette", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-skin");
  });

  it("keeps non-rgba colors unchanged", () => {
    expect(withAlpha("#88ccff", 0.4)).toBe("#88ccff");
  });

  it("normalizes rgb and rgba colors with the requested alpha", () => {
    expect(withAlpha("rgb(12, 24, 36)", 0.25)).toBe("rgba(12,24,36,0.25)");
    expect(withAlpha("rgba(12, 24, 36, 0.8)", 0.4)).toBe("rgba(12,24,36,0.4)");
  });

  it("falls back to nightfall when document is unavailable", () => {
    vi.stubGlobal("document", undefined);

    expect(resolveCurrentMonitorDeckSkin()).toBe("nightfall");
  });

  it("falls back to nightfall for invalid root skin values", () => {
    document.documentElement.setAttribute("data-skin", "unknown-skin");

    expect(resolveCurrentMonitorDeckSkin()).toBe("nightfall");
  });

  it("keeps the nightfall palette unchanged for balanced mode", () => {
    const palette = resolveMonitorDeckPalette("balanced", "nightfall");

    expect(palette.backgroundTop).toBe("rgba(9,14,19,0.98)");
    expect(palette.centerLine).toBe("rgba(72,215,255,0.88)");
    expect(palette.trackGlow).toBe("rgba(72,215,255,0.12)");
    expect(palette.overviewFillStops).toHaveLength(6);
  });

  it("adjusts arctic glows by preset intensity", () => {
    const passive = resolveMonitorDeckPalette("passive", "arctic");
    const alert = resolveMonitorDeckPalette("alert", "arctic");

    expect(passive.trackGlow).toBe("rgba(125,227,255,0.1)");
    expect(alert.trackGlow).toBe("rgba(125,227,255,0.18)");
    expect(passive.overviewBaseGlow).toBe("rgba(125,227,255,0.14)");
    expect(alert.overviewBaseGlow).toBe("rgba(125,227,255,0.24)");
    expect(alert.playheadCore).toBe("rgba(244,252,255,0.96)");
  });

  it("adjusts copper glows by preset intensity", () => {
    const passive = resolveMonitorDeckPalette("passive", "copper");
    const balanced = resolveMonitorDeckPalette("balanced", "copper");
    const alert = resolveMonitorDeckPalette("alert", "copper");

    expect(passive.trackGlow).toBe("rgba(255,176,102,0.1)");
    expect(balanced.trackGlow).toBe("rgba(255,176,102,0.14)");
    expect(alert.trackGlow).toBe("rgba(255,176,102,0.18)");
    expect(balanced.centerLine).toBe("rgba(255,176,102,0.92)");
    expect(alert.markerErrorBeam).toBe("rgba(255,92,122,0.9)");
  });

  it("falls back to the base palette for unsupported skins", () => {
    const invalidPalette = resolveMonitorDeckPalette("passive", "invalid-skin" as never);
    const defaultPalette = resolveMonitorDeckPalette("passive", "nightfall");

    expect(invalidPalette).toEqual(defaultPalette);
  });
});
