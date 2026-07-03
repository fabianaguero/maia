import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildMonitorSetupDeckControlsHookInput,
  buildMonitorSetupProfileHookResult,
  buildMonitorSetupProfileViewModelInput,
} from "../../../src/features/simple/monitorSetupProfileHookRuntime";

describe("monitorSetupProfileHookRuntime", () => {
  it("builds deck-control and view-model inputs from setup profile state", () => {
    const hookInput = buildMonitorSetupDeckControlsHookInput({ skin: "nightfall" });
    const profile = {
      deckControls: [{ id: "reactivity" }],
      setupPreferences: { defaultCloudLookback: "10m" },
      activePreset: "balanced",
      isDirty: false,
    } as never;

    const viewModelInput = buildMonitorSetupProfileViewModelInput({
      profile,
      lang: "en",
      skin: "nightfall",
      t: en,
    });

    expect(hookInput).toEqual({ skin: "nightfall" });
    expect(viewModelInput.controls).toBe(profile.deckControls);
    expect(viewModelInput.activePreset).toBe("balanced");
    expect(viewModelInput.t).toBe(en);
  });

  it("returns the hook contract without mutation", () => {
    const result = buildMonitorSetupProfileHookResult({
      profile: { activePreset: "balanced" } as never,
      viewModel: { summaryCards: [] } as never,
      updateDeckControl: vi.fn(),
      resetDeckControls: vi.fn(),
      applyDeckPreset: vi.fn(),
    });

    expect(result.profile.activePreset).toBe("balanced");
    expect(result.viewModel.summaryCards).toEqual([]);
  });
});
