import { describe, expect, it } from "vitest";

import {
  APP_V0_LANG_STORAGE_KEY,
  applyAppV0SkinPreference,
  isAppV0Language,
  loadAppV0Preferences,
  persistAppV0Language,
  persistAppV0SetupPreferences,
  persistAppV0Skin,
} from "../src/appV0Preferences";
import { APP_V0_SKIN_STORAGE_KEY } from "../src/features/simple/appSkin";
import { MONITOR_SETUP_PREFERENCES_STORAGE_KEY } from "../src/features/simple/monitorSetupPreferences";

function createMemoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    dump() {
      return Object.fromEntries(store.entries());
    },
  };
}

describe("appV0Preferences", () => {
  it("detects allowed interface languages", () => {
    expect(isAppV0Language("es")).toBe(true);
    expect(isAppV0Language("en")).toBe(true);
    expect(isAppV0Language("pt")).toBe(false);
    expect(isAppV0Language(null)).toBe(false);
  });

  it("loads persisted shell preferences and sanitizes invalid values", () => {
    const storage = createMemoryStorage({
      [APP_V0_LANG_STORAGE_KEY]: "en",
      [APP_V0_SKIN_STORAGE_KEY]: "copper",
      [MONITOR_SETUP_PREFERENCES_STORAGE_KEY]: JSON.stringify({
        defaultCloudLookback: "120m",
        idleHoldMs: 12000,
        tailWindowRows: 50,
      }),
    });

    expect(loadAppV0Preferences(storage)).toEqual({
      lang: "en",
      skin: "copper",
      setupPreferences: {
        defaultCloudLookback: "120m",
        idleHoldMs: 10000,
        tailWindowRows: 200,
      },
    });

    expect(
      loadAppV0Preferences(
        createMemoryStorage({
          [APP_V0_LANG_STORAGE_KEY]: "pt",
          [APP_V0_SKIN_STORAGE_KEY]: "void",
          [MONITOR_SETUP_PREFERENCES_STORAGE_KEY]: "{broken",
        }),
      ),
    ).toEqual({
      lang: "es",
      skin: "nightfall",
      setupPreferences: {
        defaultCloudLookback: "10m",
        idleHoldMs: 900,
        tailWindowRows: 1200,
      },
    });
  });

  it("persists shell preferences and applies the active skin to the root element", () => {
    const storage = createMemoryStorage();
    const rootElement = {
      applied: "",
      setAttribute(_name: string, value: string) {
        this.applied = value;
      },
    };

    persistAppV0Language(storage, "en");
    persistAppV0Skin(storage, "arctic");
    persistAppV0SetupPreferences(storage, {
      defaultCloudLookback: "30m",
      idleHoldMs: 1400,
      tailWindowRows: 900,
    });
    applyAppV0SkinPreference(rootElement, "arctic");

    expect(storage.dump()).toEqual({
      [APP_V0_LANG_STORAGE_KEY]: "en",
      [APP_V0_SKIN_STORAGE_KEY]: "arctic",
      [MONITOR_SETUP_PREFERENCES_STORAGE_KEY]:
        '{"defaultCloudLookback":"30m","idleHoldMs":1400,"tailWindowRows":900}',
    });
    expect(rootElement.applied).toBe("arctic");
  });
});
