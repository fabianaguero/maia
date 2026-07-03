import type { SequencerPreset } from "./liveSonificationSceneTypes";

export const SEQUENCER_PRESETS: Record<string, SequencerPreset> = {
  sparse: {
    label: "Sparse",
    descriptor: "Quiet baseline; only warnings, errors, and anomalies stand out",
    maxCuesPerWindow: 4,
    scheduleGapMs: 180,
    infoGainMultiplier: 0.42,
    warnGainMultiplier: 0.72,
    errorGainMultiplier: 1.14,
    anomalyGainMultiplier: 1.28,
    useBeatGrid: false,
    rhythmDivision: 4,
  },
  balanced: {
    label: "Balanced",
    descriptor: "All severity levels at natural gain spread with even spacing",
    maxCuesPerWindow: 8,
    scheduleGapMs: 80,
    infoGainMultiplier: 1.0,
    warnGainMultiplier: 1.0,
    errorGainMultiplier: 1.0,
    anomalyGainMultiplier: 1.0,
    useBeatGrid: false,
    rhythmDivision: 8,
  },
  cascade: {
    label: "Cascade",
    descriptor: "Dense rapid-fire — every cue plays in quick succession at high gain",
    maxCuesPerWindow: 14,
    scheduleGapMs: 36,
    infoGainMultiplier: 1.04,
    warnGainMultiplier: 1.08,
    errorGainMultiplier: 1.18,
    anomalyGainMultiplier: 1.32,
    useBeatGrid: false,
    rhythmDivision: 16,
  },
  "beat-locked": {
    label: "Beat-locked",
    descriptor: "Snaps cue spacing to the live BPM rhythm grid at eighth-note resolution",
    maxCuesPerWindow: 8,
    scheduleGapMs: 80,
    infoGainMultiplier: 0.9,
    warnGainMultiplier: 1.0,
    errorGainMultiplier: 1.12,
    anomalyGainMultiplier: 1.22,
    useBeatGrid: true,
    rhythmDivision: 8,
  },
};

export const BALANCED_PRESET: SequencerPreset = {
  label: "Balanced",
  descriptor: "All severity levels at natural gain spread with even spacing",
  maxCuesPerWindow: 8,
  scheduleGapMs: 80,
  infoGainMultiplier: 1.0,
  warnGainMultiplier: 1.0,
  errorGainMultiplier: 1.0,
  anomalyGainMultiplier: 1.0,
  useBeatGrid: false,
  rhythmDivision: 8,
};

export const COMPONENT_PAN_SPREAD = [-0.72, -0.36, -0.12, 0.12, 0.42, 0.74];
export const COMPONENT_NOTE_SPREAD = [0.92, 0.96, 1.0, 1.04, 1.08, 1.12];
