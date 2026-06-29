import { describe, expect, it } from "vitest";

import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import { buildMonitorSetupScreenViewModel } from "../../../src/features/simple/monitorSetupViewModel";
import { buildMonitorSetupScreenModel } from "../../../src/features/simple/monitorSetupScreenRuntime";
import { en } from "../../../src/i18n/en";

describe("monitorSetupScreenRuntime", () => {
  it("partitions preset cards and exposes the summary icon bank", () => {
    const viewModel = buildMonitorSetupScreenViewModel({
      controls: {
        waveformScale: 1,
        beatSnapSubdivision: 0.25,
        reactivity: 55,
        anomalyEmphasis: 70,
        idleMotion: 30,
        cueCooldownMs: 850,
        masterVolume: 0.75,
        duckingIntensity: 35,
        recoveryRelease: 45,
        alertShape: "tight",
      },
      lang: "en",
      skin: "nightfall",
      activePreset: "balanced",
      isDirty: false,
      setupPreferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
      t: en,
    });

    const model = buildMonitorSetupScreenModel(viewModel);

    expect(model.presetCards.map((preset) => preset.id)).toEqual(["passive", "balanced", "alert"]);
    expect(model.customPresetCard?.id).toBe("custom");
    expect(Object.keys(model.setupIcons)).toEqual([
      "reactive-mix",
      "anomaly-emphasis",
      "idle-motion",
      "monitor-level",
      "ducking-intensity",
      "recovery-release",
      "alert-shape",
    ]);
  });
});
