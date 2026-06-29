import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_MONITOR_DECK_CONTROLS,
  MONITOR_DECK_CONTROLS_STORAGE_KEY,
  MONITOR_DECK_PRESETS,
} from "../../../src/features/simple/monitorDeckControls";
import {
  applyMonitorDeckPreset,
  persistMonitorDeckControls,
  readMonitorDeckControls,
  updateMonitorDeckControls,
} from "../../../src/features/simple/monitorDeckControlsRuntime";

describe("monitorDeckControlsRuntime", () => {
  it("reads persisted deck controls and falls back to defaults without storage", () => {
    const storage = {
      getItem: vi.fn(() =>
        JSON.stringify({
          waveformScale: 1.6,
          reactivity: 55,
          anomalyEmphasis: 66,
          idleMotion: 25,
          masterVolume: 0.5,
          duckingIntensity: 30,
          recoveryRelease: 70,
          alertShape: "soft",
          cueCooldownMs: 1800,
          beatSnapSubdivision: 0.125,
        }),
      ),
    };

    expect(readMonitorDeckControls(storage)).toMatchObject({
      waveformScale: 1.6,
      reactivity: 55,
      alertShape: "soft",
      beatSnapSubdivision: 0.125,
    });
    expect(storage.getItem).toHaveBeenCalledWith(MONITOR_DECK_CONTROLS_STORAGE_KEY);
    expect(readMonitorDeckControls(null)).toEqual(DEFAULT_MONITOR_DECK_CONTROLS);
  });

  it("persists deck controls to storage", () => {
    const storage = { setItem: vi.fn() };

    persistMonitorDeckControls(storage, DEFAULT_MONITOR_DECK_CONTROLS);

    expect(storage.setItem).toHaveBeenCalledWith(
      MONITOR_DECK_CONTROLS_STORAGE_KEY,
      JSON.stringify(DEFAULT_MONITOR_DECK_CONTROLS),
    );
  });

  it("updates a single deck control through sanitized runtime rules and applies presets", () => {
    expect(
      updateMonitorDeckControls({
        current: DEFAULT_MONITOR_DECK_CONTROLS,
        key: "waveformScale",
        value: 9,
      }).waveformScale,
    ).toBe(3.5);

    expect(applyMonitorDeckPreset("alert")).toEqual(MONITOR_DECK_PRESETS.alert);
  });
});
