export interface MonitorDeckControls {
  waveformScale: number;
  reactivity: number;
  anomalyEmphasis: number;
  idleMotion: number;
  cueCooldownMs: number;
  beatSnapSubdivision: number;
}

export const MONITOR_DECK_CONTROLS_STORAGE_KEY = "maia.monitor-deck-controls.v1";

export const DEFAULT_MONITOR_DECK_CONTROLS: MonitorDeckControls = {
  waveformScale: 1,
  reactivity: 72,
  anomalyEmphasis: 68,
  idleMotion: 34,
  cueCooldownMs: 2600,
  beatSnapSubdivision: 0.25,
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
