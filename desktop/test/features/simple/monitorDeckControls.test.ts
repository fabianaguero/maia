import { describe, expect, it } from "vitest";

import {
  areMonitorDeckControlsEqual,
  DEFAULT_MONITOR_DECK_CONTROLS,
  loadMonitorDeckControls,
  MONITOR_DECK_PRESETS,
  resolveActiveMonitorDeckPreset,
  sanitizeMonitorDeckControls,
} from "../../../src/features/simple/monitorDeckControls";

describe("monitorDeckControls", () => {
  it("sanitizes deck control values into safe ranges", () => {
    const sanitized = sanitizeMonitorDeckControls({
      waveformScale: 9,
      reactivity: -10,
      anomalyEmphasis: 120,
      idleMotion: 300,
      masterVolume: 9,
      duckingIntensity: 140,
      recoveryRelease: -10,
      alertShape: "broken" as never,
      cueCooldownMs: 50,
      beatSnapSubdivision: 0.33,
    });

    expect(sanitized.waveformScale).toBe(3.5);
    expect(sanitized.reactivity).toBe(0);
    expect(sanitized.anomalyEmphasis).toBe(100);
    expect(sanitized.idleMotion).toBe(100);
    expect(sanitized.masterVolume).toBe(1);
    expect(sanitized.duckingIntensity).toBe(100);
    expect(sanitized.recoveryRelease).toBe(0);
    expect(sanitized.alertShape).toBe(DEFAULT_MONITOR_DECK_CONTROLS.alertShape);
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
        masterVolume: 0.58,
        duckingIntensity: 37,
        recoveryRelease: 71,
        alertShape: "soft",
        cueCooldownMs: 1800,
        beatSnapSubdivision: 0.125,
      }),
    );

    expect(loaded).toMatchObject({
      waveformScale: 1.8,
      reactivity: 64,
      anomalyEmphasis: 88,
      idleMotion: 21,
      masterVolume: 0.58,
      duckingIntensity: 37,
      recoveryRelease: 71,
      alertShape: "soft",
      cueCooldownMs: 1800,
      beatSnapSubdivision: 0.125,
    });
    expect(loadMonitorDeckControls("{bad-json")).toEqual(DEFAULT_MONITOR_DECK_CONTROLS);
  });

  it("resolves preset matches and detects custom edits", () => {
    expect(resolveActiveMonitorDeckPreset(MONITOR_DECK_PRESETS.passive)).toBe("passive");
    expect(resolveActiveMonitorDeckPreset(MONITOR_DECK_PRESETS.balanced)).toBe("balanced");
    expect(resolveActiveMonitorDeckPreset(MONITOR_DECK_PRESETS.alert)).toBe("alert");
    expect(
      resolveActiveMonitorDeckPreset({
        ...MONITOR_DECK_PRESETS.alert,
        cueCooldownMs: MONITOR_DECK_PRESETS.alert.cueCooldownMs + 100,
      }),
    ).toBe("custom");
    expect(
      areMonitorDeckControlsEqual(MONITOR_DECK_PRESETS.balanced, DEFAULT_MONITOR_DECK_CONTROLS),
    ).toBe(true);
  });
});
