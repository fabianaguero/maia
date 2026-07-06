import type { AppSkin } from "./appSkin";
import type { MonitorDeckPresetId } from "./monitorDeckControls";
import type {
  MonitorSetupOptionViewModel,
  MonitorSetupScreenViewModelInput,
} from "./monitorSetupViewModelRuntime";

function resolveMonitorSetupOptionChipLabel(input: {
  isActive: boolean;
  t: MonitorSetupScreenViewModelInput["t"];
}): string {
  return input.isActive
    ? input.t.simpleMode.deckSetup.presetCurrent
    : input.t.simpleMode.deckSetup.presetApply;
}

export function buildMonitorSetupLanguageOptions(
  input: MonitorSetupScreenViewModelInput,
): Array<MonitorSetupOptionViewModel<"en" | "es">> {
  return [
    {
      id: "es",
      label: `ES · ${input.t.simpleMode.deckSetup.spanish}`,
      detail: input.t.simpleMode.deckSetup.languageDescription,
      isActive: input.lang === "es",
      chipLabel: resolveMonitorSetupOptionChipLabel({
        isActive: input.lang === "es",
        t: input.t,
      }),
    },
    {
      id: "en",
      label: `EN · ${input.t.simpleMode.deckSetup.english}`,
      detail: input.t.simpleMode.deckSetup.languageDescription,
      isActive: input.lang === "en",
      chipLabel: resolveMonitorSetupOptionChipLabel({
        isActive: input.lang === "en",
        t: input.t,
      }),
    },
  ];
}

export function buildMonitorSetupSkinCards(input: MonitorSetupScreenViewModelInput): Array<
  MonitorSetupOptionViewModel<AppSkin> & {
    swatches: string[];
  }
> {
  return [
    {
      id: "nightfall",
      label: input.t.simpleMode.deckSetup.skinNightfall,
      detail: input.t.simpleMode.deckSetup.skinNightfallDetail,
      isActive: input.skin === "nightfall",
      chipLabel: resolveMonitorSetupOptionChipLabel({
        isActive: input.skin === "nightfall",
        t: input.t,
      }),
      swatches: ["#48d7ff", "#00c2a8", "#ff4757"],
    },
    {
      id: "arctic",
      label: input.t.simpleMode.deckSetup.skinArctic,
      detail: input.t.simpleMode.deckSetup.skinArcticDetail,
      isActive: input.skin === "arctic",
      chipLabel: resolveMonitorSetupOptionChipLabel({
        isActive: input.skin === "arctic",
        t: input.t,
      }),
      swatches: ["#7de3ff", "#1cc8cf", "#6fb9ff"],
    },
    {
      id: "copper",
      label: input.t.simpleMode.deckSetup.skinCopper,
      detail: input.t.simpleMode.deckSetup.skinCopperDetail,
      isActive: input.skin === "copper",
      chipLabel: resolveMonitorSetupOptionChipLabel({
        isActive: input.skin === "copper",
        t: input.t,
      }),
      swatches: ["#ffb066", "#f6ce63", "#ff6b7a"],
    },
  ];
}

export function buildMonitorSetupPresetCards(
  input: MonitorSetupScreenViewModelInput,
): Array<MonitorSetupOptionViewModel<MonitorDeckPresetId | "custom">> {
  return [
    {
      id: "passive",
      label: input.t.simpleMode.deckSetup.presetPassive,
      detail: input.t.simpleMode.deckSetup.presetPassiveDetail,
      isActive: input.activePreset === "passive",
      chipLabel: resolveMonitorSetupOptionChipLabel({
        isActive: input.activePreset === "passive",
        t: input.t,
      }),
    },
    {
      id: "balanced",
      label: input.t.simpleMode.deckSetup.presetBalanced,
      detail: input.t.simpleMode.deckSetup.presetBalancedDetail,
      isActive: input.activePreset === "balanced",
      chipLabel: resolveMonitorSetupOptionChipLabel({
        isActive: input.activePreset === "balanced",
        t: input.t,
      }),
    },
    {
      id: "alert",
      label: input.t.simpleMode.deckSetup.presetAlert,
      detail: input.t.simpleMode.deckSetup.presetAlertDetail,
      isActive: input.activePreset === "alert",
      chipLabel: resolveMonitorSetupOptionChipLabel({
        isActive: input.activePreset === "alert",
        t: input.t,
      }),
    },
    {
      id: "custom",
      label: input.t.simpleMode.deckSetup.presetCustom,
      detail: input.t.simpleMode.deckSetup.presetCustomDetail,
      isActive: input.activePreset === "custom",
      chipLabel:
        input.activePreset === "custom"
          ? input.t.simpleMode.deckSetup.presetCurrent
          : input.isDirty
            ? input.t.simpleMode.deckSetup.presetEdited
            : input.t.simpleMode.deckSetup.presetNeutral,
    },
  ];
}
