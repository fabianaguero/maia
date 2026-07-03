import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildMonitorSetupScreenHookResult,
  buildMonitorSetupScreenModelInput,
  buildMonitorSetupScreenProfileInput,
} from "../../../src/features/simple/monitorSetupScreenModelHookRuntime";

describe("monitorSetupScreenModelHookRuntime", () => {
  it("builds profile and screen-model inputs from the setup screen state", () => {
    const input = {
      lang: "es" as const,
      skin: "daybreak" as const,
      setupPreferences: {
        defaultCloudLookback: "30m",
      },
      t: en,
    } as never;

    const profileInput = buildMonitorSetupScreenProfileInput(input);
    const screenModelInput = buildMonitorSetupScreenModelInput({
      t: en,
      viewModel: { summaryCards: [] } as never,
    });

    expect(profileInput).toBe(input);
    expect(screenModelInput.t).toBe(en);
    expect(screenModelInput.viewModel.summaryCards).toEqual([]);
  });

  it("returns the composed screen-model hook contract without mutation", () => {
    const result = buildMonitorSetupScreenHookResult({
      profile: { activePreset: "balanced" } as never,
      viewModel: { summaryCards: [] } as never,
      screenModel: { presetCards: [] },
      updateDeckControl: vi.fn(),
      resetDeckControls: vi.fn(),
      applyDeckPreset: vi.fn(),
    });

    expect(result.profile.activePreset).toBe("balanced");
    expect(result.screenModel.presetCards).toEqual([]);
  });
});
