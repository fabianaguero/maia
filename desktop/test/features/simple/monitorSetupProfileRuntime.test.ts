import { describe, expect, it } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import { buildMonitorSetupProfile } from "../../../src/features/simple/monitorSetupProfileRuntime";

describe("monitorSetupProfileRuntime", () => {
  it("builds a unified setup profile from deck controls and runtime defaults", () => {
    expect(
      buildMonitorSetupProfile({
        deckControls: DEFAULT_MONITOR_DECK_CONTROLS,
        setupPreferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
        activePreset: "balanced",
        isDirty: false,
      }),
    ).toEqual({
      deckControls: DEFAULT_MONITOR_DECK_CONTROLS,
      setupPreferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
      activePreset: "balanced",
      isDirty: false,
    });
  });
});
