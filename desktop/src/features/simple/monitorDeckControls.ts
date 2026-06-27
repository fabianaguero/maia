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

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

function sanitizeBeatSnapSubdivision(value: number): number {
  const allowed = [0.5, 0.25, 0.125];
  return allowed.includes(value) ? value : DEFAULT_MONITOR_DECK_CONTROLS.beatSnapSubdivision;
}

function sanitizeAlertShape(value: MonitorAlertShape | string | undefined): MonitorAlertShape {
  const allowed: MonitorAlertShape[] = ["soft", "tight", "aggressive"];
  return allowed.includes(value as MonitorAlertShape)
    ? (value as MonitorAlertShape)
    : DEFAULT_MONITOR_DECK_CONTROLS.alertShape;
}

export function sanitizeMonitorDeckControls(
  value: Partial<MonitorDeckControls> | null | undefined,
): MonitorDeckControls {
  return {
    waveformScale: clamp(
      value?.waveformScale ?? DEFAULT_MONITOR_DECK_CONTROLS.waveformScale,
      0.5,
      3.5,
    ),
    reactivity: clamp(value?.reactivity ?? DEFAULT_MONITOR_DECK_CONTROLS.reactivity, 0, 100),
    anomalyEmphasis: clamp(
      value?.anomalyEmphasis ?? DEFAULT_MONITOR_DECK_CONTROLS.anomalyEmphasis,
      0,
      100,
    ),
    idleMotion: clamp(value?.idleMotion ?? DEFAULT_MONITOR_DECK_CONTROLS.idleMotion, 0, 100),
    masterVolume: clamp(
      value?.masterVolume ?? DEFAULT_MONITOR_DECK_CONTROLS.masterVolume,
      0,
      1,
    ),
    duckingIntensity: clamp(
      value?.duckingIntensity ?? DEFAULT_MONITOR_DECK_CONTROLS.duckingIntensity,
      0,
      100,
    ),
    recoveryRelease: clamp(
      value?.recoveryRelease ?? DEFAULT_MONITOR_DECK_CONTROLS.recoveryRelease,
      0,
      100,
    ),
    alertShape: sanitizeAlertShape(value?.alertShape),
    cueCooldownMs: clamp(
      value?.cueCooldownMs ?? DEFAULT_MONITOR_DECK_CONTROLS.cueCooldownMs,
      400,
      6000,
    ),
    beatSnapSubdivision: sanitizeBeatSnapSubdivision(
      value?.beatSnapSubdivision ?? DEFAULT_MONITOR_DECK_CONTROLS.beatSnapSubdivision,
    ),
  };
}

export function loadMonitorDeckControls(raw: string | null | undefined): MonitorDeckControls {
  if (!raw) {
    return DEFAULT_MONITOR_DECK_CONTROLS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MonitorDeckControls>;
    return sanitizeMonitorDeckControls(parsed);
  } catch {
    return DEFAULT_MONITOR_DECK_CONTROLS;
  }
}

export function areMonitorDeckControlsEqual(
  left: MonitorDeckControls,
  right: MonitorDeckControls,
): boolean {
  return (
    left.waveformScale === right.waveformScale &&
    left.reactivity === right.reactivity &&
    left.anomalyEmphasis === right.anomalyEmphasis &&
    left.idleMotion === right.idleMotion &&
    left.masterVolume === right.masterVolume &&
    left.duckingIntensity === right.duckingIntensity &&
    left.recoveryRelease === right.recoveryRelease &&
    left.alertShape === right.alertShape &&
    left.cueCooldownMs === right.cueCooldownMs &&
    left.beatSnapSubdivision === right.beatSnapSubdivision
  );
}

export function resolveActiveMonitorDeckPreset(
  controls: MonitorDeckControls,
): MonitorDeckPresetId | "custom" {
  const matchedPreset = (Object.entries(MONITOR_DECK_PRESETS) as Array<
    [MonitorDeckPresetId, MonitorDeckControls]
  >).find(([, preset]) => areMonitorDeckControlsEqual(controls, preset));

  return matchedPreset?.[0] ?? "custom";
}
