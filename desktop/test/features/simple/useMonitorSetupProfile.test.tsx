import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import { useMonitorSetupProfile } from "../../../src/features/simple/useMonitorSetupProfile";
import { en } from "../../../src/i18n/en";

const mockedUseMonitorDeckControls = vi.fn();

vi.mock("../../../src/features/simple/useMonitorDeckControls", () => ({
  useMonitorDeckControls: () => mockedUseMonitorDeckControls(),
}));

describe("useMonitorSetupProfile", () => {
  it("combines deck controls with runtime defaults and derives the setup view-model", () => {
    const updateDeckControl = vi.fn();
    const resetDeckControls = vi.fn();
    const applyDeckPreset = vi.fn();

    mockedUseMonitorDeckControls.mockReturnValue({
      deckControls: DEFAULT_MONITOR_DECK_CONTROLS,
      updateDeckControl,
      resetDeckControls,
      applyDeckPreset,
      activePreset: "balanced",
      isDirty: false,
    });

    const { result } = renderHook(() =>
      useMonitorSetupProfile({
        lang: "en",
        skin: "nightfall",
        setupPreferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
        t: en,
      }),
    );

    expect(result.current.profile).toMatchObject({
      deckControls: DEFAULT_MONITOR_DECK_CONTROLS,
      setupPreferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
      activePreset: "balanced",
      isDirty: false,
    });
    expect(result.current.viewModel.summaryCards).toHaveLength(7);
    expect(result.current.viewModel.runtimeDefaultGroups.map((group) => group.key)).toEqual([
      "cloud-defaults",
      "stream-runtime",
    ]);
    expect(result.current.updateDeckControl).toBe(updateDeckControl);
    expect(result.current.resetDeckControls).toBe(resetDeckControls);
    expect(result.current.applyDeckPreset).toBe(applyDeckPreset);
  });
});
