import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as ReactModule from "react";

const state = vi.hoisted(() => ({
  loadAppV0Preferences: vi.fn(() => ({
    lang: "en" as const,
    skin: "daybreak" as const,
    setupPreferences: {
      defaultCloudLookback: "45m",
      idleHoldMs: 1500,
      tailWindowRows: 777,
    },
  })),
}));

vi.mock("../../src/appV0Preferences", async () => {
  const actual = await vi.importActual("../../src/appV0Preferences");
  return {
    ...actual,
    loadAppV0Preferences: state.loadAppV0Preferences,
  };
});

describe("useAppV0PreferencesHydration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hydrates language, skin, and setup preferences from local storage", async () => {
    const { useAppV0PreferencesHydration } =
      await import("../../src/hooks/useAppV0PreferencesHydration");
    const setLang = vi.fn();
    const setSkin = vi.fn();
    const setSetupPreferences = vi.fn();

    renderHook(() =>
      useAppV0PreferencesHydration({
        setLang,
        setSkin,
        setSetupPreferences,
      }),
    );

    await waitFor(() => {
      expect(state.loadAppV0Preferences).toHaveBeenCalledWith(window.localStorage);
      expect(setLang).toHaveBeenCalledWith("en");
      expect(setSkin).toHaveBeenCalledWith("daybreak");
      expect(setSetupPreferences).toHaveBeenCalledWith({
        defaultCloudLookback: "45m",
        idleHoldMs: 1500,
        tailWindowRows: 777,
      });
    });
  });

  it("skips hydration when window is unavailable", async () => {
    vi.doMock("react", async () => {
      const actual = await vi.importActual<typeof ReactModule>("react");
      return {
        ...actual,
        useEffect: (effect: () => void) => effect(),
      };
    });
    vi.stubGlobal("window", undefined);
    const setLang = vi.fn();
    const setSkin = vi.fn();
    const setSetupPreferences = vi.fn();
    const { useAppV0PreferencesHydration } =
      await import("../../src/hooks/useAppV0PreferencesHydration");

    useAppV0PreferencesHydration({
      setLang,
      setSkin,
      setSetupPreferences,
    });

    expect(state.loadAppV0Preferences).not.toHaveBeenCalled();
    expect(setLang).not.toHaveBeenCalled();
    expect(setSkin).not.toHaveBeenCalled();
    expect(setSetupPreferences).not.toHaveBeenCalled();
  });
});
