import type { AppTranslations } from "../../i18n/en";
import {
  formatMonitorSetupIdleHold,
  formatMonitorSetupTailRows,
} from "./monitorSetupPreferenceViewModelRuntime";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import type {
  MonitorSetupCardViewModel,
  MonitorSetupPreviewMeterViewModel,
  MonitorSetupScreenViewModelInput,
  MonitorSetupSignalViewModel,
} from "./monitorSetupViewModelRuntime";
import {
  formatMonitorDeckAlertShape,
  formatMonitorDeckBeatSnap,
  formatMonitorDeckCooldown,
  formatMonitorDeckDuckingIntensity,
  formatMonitorDeckMasterVolume,
  formatMonitorDeckRecoveryRelease,
  formatMonitorDeckWaveZoom,
} from "./monitorSetupDeckMetricFormatRuntime";

export function buildMonitorSetupSummaryCards(
  input: MonitorSetupScreenViewModelInput,
): MonitorSetupCardViewModel[] {
  return [
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
  ];
}

export function buildMonitorSetupSignalChainCards(
  input: MonitorSetupScreenViewModelInput,
): MonitorSetupSignalViewModel[] {
  return [
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
  ];
}

export function buildMonitorSetupTransportCards(input: {
  setupPreferences: MonitorSetupPreferences;
  t: AppTranslations;
}): MonitorSetupSignalViewModel[] {
  return [
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
  ];
}

export function buildMonitorSetupPreviewMeters(
  input: MonitorSetupScreenViewModelInput,
): MonitorSetupPreviewMeterViewModel[] {
  return [
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
  ];
}
