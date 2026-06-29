import type { AppTranslations } from "../../i18n/en";
import type { AppSkin } from "./appSkin";
import type { MonitorDeckControls, MonitorDeckPresetId } from "./monitorDeckControls";
import {
  buildMonitorSetupPreferenceFieldViewModels,
  buildMonitorSetupPreferenceGroups,
  type MonitorSetupPreferenceFieldViewModel,
  type MonitorSetupPreferenceGroupViewModel,
  type MonitorSetupPreferences,
} from "./monitorSetupPreferences";
import {
  buildMonitorSetupPreviewMeters,
  buildMonitorSetupSignalChainCards,
  buildMonitorSetupSummaryCards,
  buildMonitorSetupTransportCards,
} from "./monitorSetupDeckMetricsRuntime";
import {
  buildMonitorSetupLanguageOptions,
  buildMonitorSetupPresetCards,
  buildMonitorSetupSkinCards,
} from "./monitorSetupIdentityRuntime";

export {
  buildMonitorSetupPreviewMeters,
  buildMonitorSetupSignalChainCards,
  buildMonitorSetupSummaryCards,
  buildMonitorSetupTransportCards,
  formatMonitorDeckAlertShape,
  formatMonitorDeckBeatSnap,
  formatMonitorDeckCooldown,
  formatMonitorDeckDuckingIntensity,
  formatMonitorDeckMasterVolume,
  formatMonitorDeckRecoveryRelease,
  formatMonitorDeckWaveZoom,
} from "./monitorSetupDeckMetricsRuntime";
export {
  buildMonitorSetupLanguageOptions,
  buildMonitorSetupPresetCards,
  buildMonitorSetupSkinCards,
} from "./monitorSetupIdentityRuntime";

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

export interface MonitorSetupScreenViewModelInput {
  controls: MonitorDeckControls;
  lang: "en" | "es";
  skin: AppSkin;
  activePreset: MonitorDeckPresetId | "custom";
  isDirty: boolean;
  setupPreferences: MonitorSetupPreferences;
  t: AppTranslations;
}

export function buildMonitorSetupScreenViewModel(
  input: MonitorSetupScreenViewModelInput,
): MonitorSetupScreenViewModel {
  return {
    summaryCards: buildMonitorSetupSummaryCards(input),
    signalChainCards: buildMonitorSetupSignalChainCards(input),
    transportCards: buildMonitorSetupTransportCards({
      setupPreferences: input.setupPreferences,
      t: input.t,
    }),
    languageOptions: buildMonitorSetupLanguageOptions(input),
    skinCards: buildMonitorSetupSkinCards(input),
    presetCards: buildMonitorSetupPresetCards(input),
    previewMeters: buildMonitorSetupPreviewMeters(input),
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
