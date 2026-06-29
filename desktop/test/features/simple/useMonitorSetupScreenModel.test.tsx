import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import { useMonitorSetupScreenModel } from "../../../src/features/simple/useMonitorSetupScreenModel";
import { en } from "../../../src/i18n/en";

describe("useMonitorSetupScreenModel", () => {
  it("composes profile, screen view model and screen model", () => {
    const { result } = renderHook(() =>
      useMonitorSetupScreenModel({
        lang: "en",
        skin: "nightfall",
        setupPreferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
        t: en,
      }),
    );

    expect(result.current.profile.activePreset).toBeDefined();
    expect(result.current.viewModel.summaryCards.length).toBeGreaterThan(0);
    expect(result.current.screenModel.presetCards.length).toBe(3);
    expect(result.current.screenModel.customPresetCard?.id).toBe("custom");
  });
});
