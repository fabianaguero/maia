import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppV0PreferencesState } from "../../src/hooks/useAppV0PreferencesState";

const state = vi.hoisted(() => ({
  loadAppV0Preferences: vi.fn(() => ({
    lang: "en" as const,
    skin: "daybreak" as const,
    setupPreferences: {
      defaultCloudLookback: "30m",
      idleHoldMs: 1400,
      tailWindowRows: 900,
    },
  })),
  persistAppV0Language: vi.fn(),
  persistAppV0SetupPreferences: vi.fn(),
  persistAppV0Skin: vi.fn(),
  applyAppV0SkinPreference: vi.fn(),
}));

vi.mock("../../src/appV0Preferences", async () => {
  const actual = await vi.importActual("../../src/appV0Preferences");
  return {
    ...actual,
    loadAppV0Preferences: state.loadAppV0Preferences,
    persistAppV0Language: state.persistAppV0Language,
    persistAppV0SetupPreferences: state.persistAppV0SetupPreferences,
    persistAppV0Skin: state.persistAppV0Skin,
    applyAppV0SkinPreference: state.applyAppV0SkinPreference,
  };
});

describe("useAppV0PreferencesState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("hydrates and persists app preferences", async () => {
    const { result } = renderHook(() => useAppV0PreferencesState());

    await waitFor(() => {
      expect(state.loadAppV0Preferences).toHaveBeenCalledWith(window.localStorage);
      expect(result.current.lang).toBe("en");
      expect(result.current.skin).toBe("daybreak");
      expect(result.current.setupPreferences.defaultCloudLookback).toBe("30m");
    });

    await waitFor(() => {
      expect(state.persistAppV0Language).toHaveBeenCalledWith(window.localStorage, "en");
      expect(state.persistAppV0Skin).toHaveBeenCalledWith(window.localStorage, "daybreak");
      expect(state.applyAppV0SkinPreference).toHaveBeenCalledWith(
        document.documentElement,
        "daybreak",
      );
      expect(state.persistAppV0SetupPreferences).toHaveBeenCalledWith(
        window.localStorage,
        expect.objectContaining({
          defaultCloudLookback: "30m",
          idleHoldMs: 1400,
          tailWindowRows: 900,
        }),
      );
    });
  });

  it("updates sanitized setup preferences", async () => {
    const { result } = renderHook(() => useAppV0PreferencesState());

    await waitFor(() => {
      expect(result.current.setupPreferences.tailWindowRows).toBe(900);
    });

    act(() => {
      result.current.updateSetupPreference("tailWindowRows", 50);
    });

    await waitFor(() => {
      expect(result.current.setupPreferences.tailWindowRows).toBe(200);
      expect(state.persistAppV0SetupPreferences).toHaveBeenLastCalledWith(
        window.localStorage,
        expect.objectContaining({
          tailWindowRows: 200,
        }),
      );
    });
  });
});
