import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAppV0PreferencesPersistence } from "../../src/hooks/useAppV0PreferencesPersistence";
import type { MonitorSetupPreferences } from "../../src/features/simple/monitorSetupPreferences";

const state = vi.hoisted(() => ({
  persistAppV0Language: vi.fn(),
  persistAppV0SetupPreferences: vi.fn(),
  persistAppV0Skin: vi.fn(),
  applyAppV0SkinPreference: vi.fn(),
}));

vi.mock("../../src/appV0Preferences", async () => {
  const actual = await vi.importActual("../../src/appV0Preferences");
  return {
    ...actual,
    persistAppV0Language: state.persistAppV0Language,
    persistAppV0SetupPreferences: state.persistAppV0SetupPreferences,
    persistAppV0Skin: state.persistAppV0Skin,
    applyAppV0SkinPreference: state.applyAppV0SkinPreference,
  };
});

describe("useAppV0PreferencesPersistence", () => {
  const setupPreferences: MonitorSetupPreferences = {
    defaultCloudLookback: "45m",
    idleHoldMs: 1200,
    tailWindowRows: 1600,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists language, skin and setup preferences into browser storage", () => {
    renderHook(() =>
      useAppV0PreferencesPersistence({
        lang: "en",
        skin: "arctic",
        setupPreferences,
      }),
    );

    expect(state.persistAppV0Language).toHaveBeenCalledWith(window.localStorage, "en");
    expect(state.persistAppV0Skin).toHaveBeenCalledWith(window.localStorage, "arctic");
    expect(state.applyAppV0SkinPreference).toHaveBeenCalledWith(document.documentElement, "arctic");
    expect(state.persistAppV0SetupPreferences).toHaveBeenCalledWith(
      window.localStorage,
      setupPreferences,
    );
  });

  it("skips persistence side effects when window is unavailable", () => {
    const previousWindow = globalThis.window;
    vi.stubGlobal("window", undefined);

    function TestComponent() {
      useAppV0PreferencesPersistence({
        lang: "es",
        skin: "nightfall",
        setupPreferences,
      });
      return null;
    }

    renderToString(<TestComponent />);

    expect(state.persistAppV0Language).not.toHaveBeenCalled();
    expect(state.persistAppV0Skin).not.toHaveBeenCalled();
    expect(state.applyAppV0SkinPreference).not.toHaveBeenCalled();
    expect(state.persistAppV0SetupPreferences).not.toHaveBeenCalled();

    vi.stubGlobal("window", previousWindow);
  });
});
