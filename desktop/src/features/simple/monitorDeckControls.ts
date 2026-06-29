import type { AppSkin } from "./appSkin";

export type MonitorAlertShape = "soft" | "tight" | "aggressive";
export type MonitorDeckPresetId = "passive" | "balanced" | "alert";

export interface MonitorDeckControls {
  waveformScale: number;
  reactivity: number;
  anomalyEmphasis: number;
  idleMotion: number;
  masterVolume: number;
  duckingIntensity: number;
  recoveryRelease: number;
  alertShape: MonitorAlertShape;
  cueCooldownMs: number;
  beatSnapSubdivision: number;
}

export const MONITOR_DECK_CONTROLS_STORAGE_KEY = "maia.monitor-deck-controls.v1";
export const MONITOR_DECK_CONTROL_PROFILES_STORAGE_KEY = "maia.monitor-deck-controls.v2";

export interface MonitorDeckControlProfiles {
  activeSkin: AppSkin;
  profiles: Partial<Record<AppSkin, MonitorDeckControls>>;
}

export const DEFAULT_MONITOR_DECK_CONTROLS: MonitorDeckControls = {
  waveformScale: 1,
  reactivity: 72,
  anomalyEmphasis: 68,
  idleMotion: 34,
  masterVolume: 0.4,
  duckingIntensity: 58,
  recoveryRelease: 62,
  alertShape: "tight",
  cueCooldownMs: 2600,
  beatSnapSubdivision: 0.25,
};

export const MONITOR_DECK_PRESETS: Record<MonitorDeckPresetId, MonitorDeckControls> = {
  passive: {
    waveformScale: 0.9,
    reactivity: 38,
    anomalyEmphasis: 42,
    idleMotion: 26,
    masterVolume: 0.34,
    duckingIntensity: 24,
    recoveryRelease: 86,
    alertShape: "soft",
    cueCooldownMs: 3200,
    beatSnapSubdivision: 0.5,
  },
  balanced: {
    ...DEFAULT_MONITOR_DECK_CONTROLS,
    alertShape: "tight",
  },
  alert: {
    waveformScale: 1.2,
    reactivity: 84,
    anomalyEmphasis: 88,
    idleMotion: 18,
    masterVolume: 0.42,
    duckingIntensity: 74,
    recoveryRelease: 46,
    alertShape: "aggressive",
    cueCooldownMs: 1400,
    beatSnapSubdivision: 0.125,
  },
};
