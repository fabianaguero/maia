import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_MONITOR_DECK_CONTROLS,
  MONITOR_DECK_CONTROL_PROFILES_STORAGE_KEY,
  MONITOR_DECK_CONTROLS_STORAGE_KEY,
  MONITOR_DECK_PRESETS,
} from "../../../src/features/simple/monitorDeckControls";
import {
  applyMonitorDeckPreset,
  persistMonitorDeckControls,
  readMonitorDeckControlProfiles,
  readMonitorDeckControls,
  updateMonitorDeckControls,
} from "../../../src/features/simple/monitorDeckControlsRuntime";

describe("monitorDeckControlsRuntime", () => {
  it("reads skin-scoped deck controls and falls back to legacy storage without storage", () => {
    const storage = {
      getItem: vi.fn((key: string) => {
        if (key === MONITOR_DECK_CONTROL_PROFILES_STORAGE_KEY) {
          return JSON.stringify({
            activeSkin: "arctic",
            profiles: {
              arctic: {
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
              },
            },
          });
        }
        return JSON.stringify({
          ...DEFAULT_MONITOR_DECK_CONTROLS,
          waveformScale: 1.2,
        });
      }),
    };

    expect(readMonitorDeckControls(storage, "arctic")).toMatchObject({
      waveformScale: 1.6,
      reactivity: 55,
      alertShape: "soft",
      beatSnapSubdivision: 0.125,
    });
    expect(readMonitorDeckControls(storage, "copper")).toMatchObject({
      waveformScale: 1.2,
    });
    expect(storage.getItem).toHaveBeenCalledWith(MONITOR_DECK_CONTROL_PROFILES_STORAGE_KEY);
    expect(readMonitorDeckControls(null)).toEqual(DEFAULT_MONITOR_DECK_CONTROLS);
  });

  it("persists deck controls to both skin-scoped and legacy storage", () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };

    persistMonitorDeckControls(storage, {
      skin: "copper",
      deckControls: DEFAULT_MONITOR_DECK_CONTROLS,
    });

    expect(storage.setItem).toHaveBeenCalledWith(
      MONITOR_DECK_CONTROL_PROFILES_STORAGE_KEY,
      JSON.stringify({
        activeSkin: "copper",
        profiles: {
          copper: DEFAULT_MONITOR_DECK_CONTROLS,
        },
      }),
    );
    expect(storage.setItem).toHaveBeenCalledWith(
      MONITOR_DECK_CONTROLS_STORAGE_KEY,
      JSON.stringify(DEFAULT_MONITOR_DECK_CONTROLS),
    );
  });

  it("reads the persisted profile index as a sanitized runtime object", () => {
    const storage = {
      getItem: vi.fn(() =>
        JSON.stringify({
          activeSkin: "nightfall",
          profiles: {
            nightfall: {
              ...DEFAULT_MONITOR_DECK_CONTROLS,
              waveformScale: 8,
            },
          },
        }),
      ),
    };

    expect(readMonitorDeckControlProfiles(storage)).toEqual({
      activeSkin: "nightfall",
      profiles: {
        nightfall: {
          ...DEFAULT_MONITOR_DECK_CONTROLS,
          waveformScale: 3.5,
        },
        arctic: undefined,
        copper: undefined,
      },
    });
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
