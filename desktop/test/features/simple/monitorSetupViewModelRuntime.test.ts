import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import {
  buildMonitorSetupLanguageOptions,
  buildMonitorSetupPresetCards,
  buildMonitorSetupPreviewMeters,
  buildMonitorSetupSignalChainCards,
  buildMonitorSetupSkinCards,
  buildMonitorSetupSummaryCards,
  buildMonitorSetupTransportCards,
  type MonitorSetupScreenViewModelInput,
} from "../../../src/features/simple/monitorSetupViewModelRuntime";

function createInput(
  overrides: Partial<MonitorSetupScreenViewModelInput> = {},
): MonitorSetupScreenViewModelInput {
  return {
    controls: {
      waveformScale: 1.6,
      reactivity: 74,
      anomalyEmphasis: 61,
      idleMotion: 29,
      masterVolume: 0.4,
      duckingIntensity: 58,
      recoveryRelease: 62,
      alertShape: "tight",
      cueCooldownMs: 1800,
      beatSnapSubdivision: 0.125,
    },
    lang: "es",
    skin: "copper",
    activePreset: "balanced",
    isDirty: false,
    setupPreferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
    t: en,
    ...overrides,
  };
}

describe("monitorSetupViewModelRuntime", () => {
  it("builds summary cards from deck controls", () => {
    const cards = buildMonitorSetupSummaryCards(createInput());

    expect(cards).toHaveLength(7);
    expect(cards[0]).toMatchObject({
      key: "reactive-mix",
      value: "74%",
    });
    expect(cards[6]).toMatchObject({
      key: "alert-shape",
      value: en.simpleMode.deckSetup.alertShapeTight,
    });
  });

  it("builds signal and transport cards from visual and runtime defaults", () => {
    const input = createInput();

    expect(buildMonitorSetupSignalChainCards(input)).toEqual([
      {
        key: "language",
        label: en.simpleMode.deckSetup.languageBank,
        value: en.simpleMode.deckSetup.spanish,
      },
      {
        key: "skin",
        label: en.simpleMode.deckSetup.skinBank,
        value: en.simpleMode.deckSetup.skinCopper,
      },
      {
        key: "wave-zoom",
        label: en.simpleMode.deckSetup.waveZoom,
        value: "1.6x",
      },
      {
        key: "beat-snap",
        label: en.simpleMode.deckSetup.beatSnap,
        value: en.simpleMode.deckSetup.beatEighth,
      },
      {
        key: "cue-cooldown",
        label: en.simpleMode.deckSetup.cueCooldown,
        value: "1.8s",
      },
    ]);
    expect(buildMonitorSetupTransportCards(input)).toEqual([
      {
        key: "cloud-lookback",
        label: en.simpleMode.deckSetup.cloudLookbackDefault,
        value: "10m",
      },
      {
        key: "idle-hold",
        label: en.simpleMode.deckSetup.idleHold,
        value: "0.9s",
      },
      {
        key: "tail-window-rows",
        label: en.simpleMode.deckSetup.tailWindowRows,
        value: "1200 rows",
      },
    ]);
  });

  it("marks language and skin options using current booth identity", () => {
    const languageOptions = buildMonitorSetupLanguageOptions(createInput({ lang: "en" }));
    const skinCards = buildMonitorSetupSkinCards(createInput({ skin: "nightfall" }));

    expect(languageOptions).toEqual([
      {
        id: "es",
        label: `ES · ${en.simpleMode.deckSetup.spanish}`,
        detail: en.simpleMode.deckSetup.languageDescription,
        isActive: false,
        chipLabel: en.simpleMode.deckSetup.presetApply,
      },
      {
        id: "en",
        label: `EN · ${en.simpleMode.deckSetup.english}`,
        detail: en.simpleMode.deckSetup.languageDescription,
        isActive: true,
        chipLabel: en.simpleMode.deckSetup.presetCurrent,
      },
    ]);
    expect(skinCards[0]).toMatchObject({
      id: "nightfall",
      isActive: true,
      chipLabel: en.simpleMode.deckSetup.presetCurrent,
      swatches: ["#48d7ff", "#00c2a8", "#ff4757"],
    });
    expect(skinCards[2]).toMatchObject({
      id: "copper",
      isActive: false,
      chipLabel: en.simpleMode.deckSetup.presetApply,
    });
  });

  it("derives preset chips for active, neutral, and edited custom states", () => {
    const activeCustom = buildMonitorSetupPresetCards(
      createInput({ activePreset: "custom", isDirty: true }),
    );
    const editedBalanced = buildMonitorSetupPresetCards(
      createInput({ activePreset: "balanced", isDirty: true }),
    );
    const neutralBalanced = buildMonitorSetupPresetCards(
      createInput({ activePreset: "balanced", isDirty: false }),
    );

    expect(activeCustom.at(-1)).toMatchObject({
      id: "custom",
      isActive: true,
      chipLabel: en.simpleMode.deckSetup.presetCurrent,
    });
    expect(editedBalanced.at(-1)).toMatchObject({
      id: "custom",
      isActive: false,
      chipLabel: en.simpleMode.deckSetup.presetEdited,
    });
    expect(neutralBalanced.at(-1)).toMatchObject({
      id: "custom",
      isActive: false,
      chipLabel: en.simpleMode.deckSetup.presetNeutral,
    });
  });

  it("builds preview meters from reactive mix controls", () => {
    expect(buildMonitorSetupPreviewMeters(createInput())).toEqual([
      {
        key: "bed",
        label: en.simpleMode.deckSetup.previewTrackBed,
        value: 40,
      },
      {
        key: "reaction",
        label: en.simpleMode.deckSetup.previewLogReaction,
        value: 74,
      },
      {
        key: "contrast",
        label: en.simpleMode.deckSetup.previewAlertContrast,
        value: 60,
      },
      {
        key: "idle",
        label: en.simpleMode.deckSetup.previewIdleDrift,
        value: 29,
      },
    ]);
  });
});
