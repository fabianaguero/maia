import type { AppTranslations } from "../../i18n/en";
import type { MonitorDeckControls } from "./monitorDeckControls";

export interface MonitorSetupCardViewModel {
  key: string;
  label: string;
  value: string;
  detail: string;
}

export interface MonitorSetupSignalViewModel {
  key: string;
  label: string;
  value: string;
}

export interface MonitorSetupScreenViewModel {
  summaryCards: MonitorSetupCardViewModel[];
  signalChainCards: MonitorSetupSignalViewModel[];
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

export function buildMonitorSetupScreenViewModel(input: {
  controls: MonitorDeckControls;
  lang: "en" | "es";
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
  };
}
