import { describe, expect, it } from "vitest";

import {
  DEFAULT_MONITOR_DECK_CONTROLS,
  loadMonitorDeckControls,
  sanitizeMonitorDeckControls,
} from "../../../src/features/simple/monitorDeckControls";

describe("monitorDeckControls", () => {
  it("sanitizes deck control values into safe ranges", () => {
    const sanitized = sanitizeMonitorDeckControls({
      waveformScale: 9,
      reactivity: -10,
      anomalyEmphasis: 120,
      idleMotion: 300,
      cueCooldownMs: 50,
      beatSnapSubdivision: 0.33,
    });

    expect(sanitized.waveformScale).toBe(3.5);
    expect(sanitized.reactivity).toBe(0);
    expect(sanitized.anomalyEmphasis).toBe(100);
    expect(sanitized.idleMotion).toBe(100);
    expect(sanitized.cueCooldownMs).toBe(400);
    expect(sanitized.beatSnapSubdivision).toBe(DEFAULT_MONITOR_DECK_CONTROLS.beatSnapSubdivision);
  });

  it("loads persisted json and falls back safely on invalid values", () => {
    const loaded = loadMonitorDeckControls(
      JSON.stringify({
        waveformScale: 1.8,
        reactivity: 64,
        anomalyEmphasis: 88,
        idleMotion: 21,
        cueCooldownMs: 1800,
        beatSnapSubdivision: 0.125,
      }),
    );

    expect(loaded).toMatchObject({
      waveformScale: 1.8,
      reactivity: 64,
      anomalyEmphasis: 88,
      idleMotion: 21,
      cueCooldownMs: 1800,
      beatSnapSubdivision: 0.125,
    });
    expect(loadMonitorDeckControls("{bad-json")).toEqual(DEFAULT_MONITOR_DECK_CONTROLS);
  });
});
