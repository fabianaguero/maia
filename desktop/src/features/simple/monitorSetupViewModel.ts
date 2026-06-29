import type { AppTranslations } from "../../i18n/en";
import type { AppSkin } from "./appSkin";
import type { MonitorDeckControls, MonitorDeckPresetId } from "./monitorDeckControls";
import {
  buildMonitorSetupPreferenceFieldViewModels,
  buildMonitorSetupPreferenceGroups,
  formatMonitorSetupIdleHold,
  formatMonitorSetupTailRows,
  type MonitorSetupPreferenceFieldViewModel,
  type MonitorSetupPreferenceGroupViewModel,
  type MonitorSetupPreferences,
} from "./monitorSetupPreferences";

export interface MonitorSetupCardViewModel {
  key:
    | "reactive-mix"
    | "anomaly-emphasis"
    | "idle-motion"
    | "monitor-level"
    | "ducking-intensity"
    | "recovery-release"
    | "alert-shape";
  label: string;
  value: string;
  detail: string;
}

export interface MonitorSetupSignalViewModel {
  key: string;
  label: string;
  value: string;
}

export interface MonitorSetupOptionViewModel<TId extends string> {
  id: TId;
  label: string;
  detail: string;
  isActive: boolean;
  chipLabel: string;
}

export interface MonitorSetupPreviewMeterViewModel {
  key: string;
  label: string;
  value: number;
}

export interface MonitorSetupScreenViewModel {
  summaryCards: MonitorSetupCardViewModel[];
  signalChainCards: MonitorSetupSignalViewModel[];
  transportCards: MonitorSetupSignalViewModel[];
  languageOptions: Array<MonitorSetupOptionViewModel<"en" | "es">>;
  skinCards: Array<
    MonitorSetupOptionViewModel<AppSkin> & {
      swatches: string[];
    }
  >;
  presetCards: Array<MonitorSetupOptionViewModel<MonitorDeckPresetId | "custom">>;
  previewMeters: MonitorSetupPreviewMeterViewModel[];
  runtimeDefaultFields: MonitorSetupPreferenceFieldViewModel[];
  runtimeDefaultGroups: MonitorSetupPreferenceGroupViewModel[];
}

export function formatMonitorDeckBeatSnap(value: number, t: AppTranslations): string {
  if (value === 0.5) {
    return t.simpleMode.deckSetup.beatHalf;
  }
  if (value === 0.125) {
    return t.simpleMode.deckSetup.beatEighth;
  }
  return t.simpleMode.deckSetup.beatQuarter;
}

export function formatMonitorDeckCooldown(value: number): string {
  return `${Math.round(value / 100) / 10}s`;
}

export function formatMonitorDeckWaveZoom(value: number): string {
  return `${value.toFixed(1)}x`;
}

export function formatMonitorDeckMasterVolume(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatMonitorDeckDuckingIntensity(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatMonitorDeckRecoveryRelease(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatMonitorDeckAlertShape(
  value: MonitorDeckControls["alertShape"],
  t: AppTranslations,
): string {
  switch (value) {
    case "soft":
      return t.simpleMode.deckSetup.alertShapeSoft;
    case "aggressive":
      return t.simpleMode.deckSetup.alertShapeAggressive;
    case "tight":
    default:
      return t.simpleMode.deckSetup.alertShapeTight;
  }
}

export function buildMonitorSetupScreenViewModel(input: {
  controls: MonitorDeckControls;
  lang: "en" | "es";
  skin: AppSkin;
  activePreset: MonitorDeckPresetId | "custom";
  isDirty: boolean;
  setupPreferences: MonitorSetupPreferences;
  t: AppTranslations;
}): MonitorSetupScreenViewModel {
  return {
    summaryCards: [
      {
        key: "reactive-mix",
        label: input.t.simpleMode.deckSetup.reactiveMix,
        value: `${input.controls.reactivity}%`,
        detail: input.t.simpleMode.deckSetup.reactiveMixDetail,
      },
      {
        key: "anomaly-emphasis",
        label: input.t.simpleMode.deckSetup.anomalyEmphasis,
        value: `${input.controls.anomalyEmphasis}%`,
        detail: input.t.simpleMode.deckSetup.anomalyEmphasisDetail,
      },
      {
        key: "idle-motion",
        label: input.t.simpleMode.deckSetup.idleMotion,
        value: `${input.controls.idleMotion}%`,
        detail: input.t.simpleMode.deckSetup.idleMotionDetail,
      },
      {
        key: "monitor-level",
        label: input.t.simpleMode.deckSetup.monitorLevel,
        value: formatMonitorDeckMasterVolume(input.controls.masterVolume),
        detail: input.t.simpleMode.deckSetup.monitorLevelDetail,
      },
      {
        key: "ducking-intensity",
        label: input.t.simpleMode.deckSetup.duckingIntensity,
        value: formatMonitorDeckDuckingIntensity(input.controls.duckingIntensity),
        detail: input.t.simpleMode.deckSetup.duckingIntensityDetail,
      },
      {
        key: "recovery-release",
        label: input.t.simpleMode.deckSetup.recoveryRelease,
        value: formatMonitorDeckRecoveryRelease(input.controls.recoveryRelease),
        detail: input.t.simpleMode.deckSetup.recoveryReleaseDetail,
      },
      {
        key: "alert-shape",
        label: input.t.simpleMode.deckSetup.alertShape,
        value: formatMonitorDeckAlertShape(input.controls.alertShape, input.t),
        detail: input.t.simpleMode.deckSetup.alertShapeDetail,
      },
    ],
    signalChainCards: [
      {
        key: "language",
        label: input.t.simpleMode.deckSetup.languageBank,
        value:
          input.lang === "es"
            ? input.t.simpleMode.deckSetup.spanish
            : input.t.simpleMode.deckSetup.english,
      },
      {
        key: "skin",
        label: input.t.simpleMode.deckSetup.skinBank,
        value:
          input.skin === "arctic"
            ? input.t.simpleMode.deckSetup.skinArctic
            : input.skin === "copper"
              ? input.t.simpleMode.deckSetup.skinCopper
              : input.t.simpleMode.deckSetup.skinNightfall,
      },
      {
        key: "wave-zoom",
        label: input.t.simpleMode.deckSetup.waveZoom,
        value: formatMonitorDeckWaveZoom(input.controls.waveformScale),
      },
      {
        key: "beat-snap",
        label: input.t.simpleMode.deckSetup.beatSnap,
        value: formatMonitorDeckBeatSnap(input.controls.beatSnapSubdivision, input.t),
      },
      {
        key: "cue-cooldown",
        label: input.t.simpleMode.deckSetup.cueCooldown,
        value: formatMonitorDeckCooldown(input.controls.cueCooldownMs),
      },
    ],
    transportCards: [
      {
        key: "cloud-lookback",
        label: input.t.simpleMode.deckSetup.cloudLookbackDefault,
        value: input.setupPreferences.defaultCloudLookback,
      },
      {
        key: "idle-hold",
        label: input.t.simpleMode.deckSetup.idleHold,
        value: formatMonitorSetupIdleHold(input.setupPreferences.idleHoldMs),
      },
      {
        key: "tail-window-rows",
        label: input.t.simpleMode.deckSetup.tailWindowRows,
        value: formatMonitorSetupTailRows(input.setupPreferences.tailWindowRows),
      },
    ],
    languageOptions: [
      {
        id: "es",
        label: `ES · ${input.t.simpleMode.deckSetup.spanish}`,
        detail: input.t.simpleMode.deckSetup.languageDescription,
        isActive: input.lang === "es",
        chipLabel:
          input.lang === "es"
            ? input.t.simpleMode.deckSetup.presetCurrent
            : input.t.simpleMode.deckSetup.presetApply,
      },
      {
        id: "en",
        label: `EN · ${input.t.simpleMode.deckSetup.english}`,
        detail: input.t.simpleMode.deckSetup.languageDescription,
        isActive: input.lang === "en",
        chipLabel:
          input.lang === "en"
            ? input.t.simpleMode.deckSetup.presetCurrent
            : input.t.simpleMode.deckSetup.presetApply,
      },
    ],
    skinCards: [
      {
        id: "nightfall",
        label: input.t.simpleMode.deckSetup.skinNightfall,
        detail: input.t.simpleMode.deckSetup.skinNightfallDetail,
        isActive: input.skin === "nightfall",
        chipLabel:
          input.skin === "nightfall"
            ? input.t.simpleMode.deckSetup.presetCurrent
            : input.t.simpleMode.deckSetup.presetApply,
        swatches: ["#48d7ff", "#00c2a8", "#ff4757"],
      },
      {
        id: "arctic",
        label: input.t.simpleMode.deckSetup.skinArctic,
        detail: input.t.simpleMode.deckSetup.skinArcticDetail,
        isActive: input.skin === "arctic",
        chipLabel:
          input.skin === "arctic"
            ? input.t.simpleMode.deckSetup.presetCurrent
            : input.t.simpleMode.deckSetup.presetApply,
        swatches: ["#7de3ff", "#1cc8cf", "#6fb9ff"],
      },
      {
        id: "copper",
        label: input.t.simpleMode.deckSetup.skinCopper,
        detail: input.t.simpleMode.deckSetup.skinCopperDetail,
        isActive: input.skin === "copper",
        chipLabel:
          input.skin === "copper"
            ? input.t.simpleMode.deckSetup.presetCurrent
            : input.t.simpleMode.deckSetup.presetApply,
        swatches: ["#ffb066", "#f6ce63", "#ff6b7a"],
      },
    ],
    presetCards: [
      {
        id: "passive",
        label: input.t.simpleMode.deckSetup.presetPassive,
        detail: input.t.simpleMode.deckSetup.presetPassiveDetail,
        isActive: input.activePreset === "passive",
        chipLabel:
          input.activePreset === "passive"
            ? input.t.simpleMode.deckSetup.presetCurrent
            : input.t.simpleMode.deckSetup.presetApply,
      },
      {
        id: "balanced",
        label: input.t.simpleMode.deckSetup.presetBalanced,
        detail: input.t.simpleMode.deckSetup.presetBalancedDetail,
        isActive: input.activePreset === "balanced",
        chipLabel:
          input.activePreset === "balanced"
            ? input.t.simpleMode.deckSetup.presetCurrent
            : input.t.simpleMode.deckSetup.presetApply,
      },
      {
        id: "alert",
        label: input.t.simpleMode.deckSetup.presetAlert,
        detail: input.t.simpleMode.deckSetup.presetAlertDetail,
        isActive: input.activePreset === "alert",
        chipLabel:
          input.activePreset === "alert"
            ? input.t.simpleMode.deckSetup.presetCurrent
            : input.t.simpleMode.deckSetup.presetApply,
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
    ],
    previewMeters: [
      {
        key: "bed",
        label: input.t.simpleMode.deckSetup.previewTrackBed,
        value: Math.round(input.controls.masterVolume * 100),
      },
      {
        key: "reaction",
        label: input.t.simpleMode.deckSetup.previewLogReaction,
        value: input.controls.reactivity,
      },
      {
        key: "contrast",
        label: input.t.simpleMode.deckSetup.previewAlertContrast,
        value: Math.round((input.controls.anomalyEmphasis + input.controls.duckingIntensity) / 2),
      },
      {
        key: "idle",
        label: input.t.simpleMode.deckSetup.previewIdleDrift,
        value: input.controls.idleMotion,
      },
    ],
    runtimeDefaultFields: buildMonitorSetupPreferenceFieldViewModels({
      preferences: input.setupPreferences,
      t: input.t,
    }),
    runtimeDefaultGroups: buildMonitorSetupPreferenceGroups({
      preferences: input.setupPreferences,
      t: input.t,
    }),
  };
}
