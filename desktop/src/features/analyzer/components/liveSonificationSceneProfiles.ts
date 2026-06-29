import type { MutationProfileOption } from "../../../types/music";
import type {
  ComponentRoute,
  ReferenceAnchor,
  SequencerPreset,
} from "./liveSonificationSceneTypes";

interface CategoryProfile {
  baseWaveform: OscillatorType;
  warnWaveform: OscillatorType;
  errorWaveform: OscillatorType;
  anomalyWaveform: OscillatorType;
  noteMultiplier: number;
  durationScale: number;
  gainScale: number;
  panBias: number;
  descriptor: string;
}

interface StrategyProfile {
  noteMultiplier: number;
  durationScale: number;
  gainScale: number;
  panBias: number;
  descriptor: string;
}

interface GenreProfile {
  label: string;
  infoWaveform: OscillatorType;
  warnWaveform: OscillatorType;
  errorWaveform: OscillatorType;
  anomalyWaveform: OscillatorType;
  noteMultiplier: number;
  durationScale: number;
  gainScale: number;
  infoLabel: string;
  warnLabel: string;
  errorLabel: string;
  anomalyLabel: string;
  descriptor: string;
}

const CATEGORY_PROFILES: Record<string, CategoryProfile> = {
  collection: {
    baseWaveform: "triangle",
    warnWaveform: "triangle",
    errorWaveform: "sawtooth",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1,
    durationScale: 1,
    gainScale: 1,
    panBias: 0,
    descriptor: "balanced reusable collection",
  },
  "drum-kit": {
    baseWaveform: "square",
    warnWaveform: "triangle",
    errorWaveform: "square",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 0.76,
    durationScale: 0.78,
    gainScale: 1.12,
    panBias: 0,
    descriptor: "tight transient kit",
  },
  "bass-motif": {
    baseWaveform: "sawtooth",
    warnWaveform: "triangle",
    errorWaveform: "sawtooth",
    anomalyWaveform: "square",
    noteMultiplier: 0.64,
    durationScale: 0.92,
    gainScale: 1.08,
    panBias: -0.04,
    descriptor: "low-end anchor",
  },
  "pad-texture": {
    baseWaveform: "sine",
    warnWaveform: "triangle",
    errorWaveform: "triangle",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.08,
    durationScale: 1.34,
    gainScale: 0.88,
    panBias: -0.12,
    descriptor: "atmospheric bed",
  },
  "fx-palette": {
    baseWaveform: "triangle",
    warnWaveform: "sawtooth",
    errorWaveform: "sawtooth",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.24,
    durationScale: 0.72,
    gainScale: 1.06,
    panBias: 0.18,
    descriptor: "transition accent pack",
  },
  "vocal-hook": {
    baseWaveform: "square",
    warnWaveform: "triangle",
    errorWaveform: "square",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.28,
    durationScale: 1.08,
    gainScale: 0.96,
    panBias: 0.08,
    descriptor: "hook-forward topline layer",
  },
  "code-pattern": {
    baseWaveform: "triangle",
    warnWaveform: "triangle",
    errorWaveform: "square",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 0.94,
    durationScale: 0.94,
    gainScale: 1,
    panBias: 0,
    descriptor: "structural pattern motif",
  },
};

const STRATEGY_PROFILES: Record<string, StrategyProfile> = {
  "rhythm-foundation": {
    noteMultiplier: 0.92,
    durationScale: 0.84,
    gainScale: 1.1,
    panBias: 0,
    descriptor: "rhythm-first routing",
  },
  "low-end-anchor": {
    noteMultiplier: 0.78,
    durationScale: 0.9,
    gainScale: 1.12,
    panBias: -0.04,
    descriptor: "low-end led routing",
  },
  "harmonic-bed": {
    noteMultiplier: 1.08,
    durationScale: 1.28,
    gainScale: 0.9,
    panBias: -0.08,
    descriptor: "harmonic sustain routing",
  },
  "transition-accent": {
    noteMultiplier: 1.18,
    durationScale: 0.74,
    gainScale: 1.08,
    panBias: 0.1,
    descriptor: "transition-focused routing",
  },
  "hook-framing": {
    noteMultiplier: 1.22,
    durationScale: 1.04,
    gainScale: 0.98,
    panBias: 0.06,
    descriptor: "hook-framing routing",
  },
  "pattern-translation": {
    noteMultiplier: 1,
    durationScale: 0.92,
    gainScale: 1.04,
    panBias: 0,
    descriptor: "pattern translation routing",
  },
  "structure-follow": {
    noteMultiplier: 0.98,
    durationScale: 0.96,
    gainScale: 1,
    panBias: 0,
    descriptor: "structure-follow routing",
  },
  "layered-pack": {
    noteMultiplier: 1,
    durationScale: 1,
    gainScale: 1,
    panBias: 0,
    descriptor: "layered reusable routing",
  },
};

const GENRE_PROFILES: Record<string, GenreProfile> = {
  house: {
    label: "House",
    infoWaveform: "triangle",
    warnWaveform: "triangle",
    errorWaveform: "sawtooth",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.0,
    durationScale: 0.9,
    gainScale: 1.08,
    infoLabel: "Steady groove",
    warnLabel: "Filter lift",
    errorLabel: "Peak surge",
    anomalyLabel: "Off-beat accent",
    descriptor: "warm 4x4 instrumental groove",
  },
  "melodic-house": {
    label: "Melodic House",
    infoWaveform: "sine",
    warnWaveform: "triangle",
    errorWaveform: "sawtooth",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.04,
    durationScale: 1.06,
    gainScale: 0.96,
    infoLabel: "Melodic pulse",
    warnLabel: "Harmonic rise",
    errorLabel: "Melodic peak",
    anomalyLabel: "Detuned accent",
    descriptor: "melodic instrumental flow",
  },
  "progressive-house": {
    label: "Progressive House",
    infoWaveform: "sine",
    warnWaveform: "triangle",
    errorWaveform: "sawtooth",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.02,
    durationScale: 1.18,
    gainScale: 0.98,
    infoLabel: "Baseline phrase",
    warnLabel: "Build phrase",
    errorLabel: "Break surge",
    anomalyLabel: "Lift accent",
    descriptor: "long-build instrumental arrangement",
  },
  edm: {
    label: "EDM",
    infoWaveform: "square",
    warnWaveform: "square",
    errorWaveform: "sawtooth",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.05,
    durationScale: 0.72,
    gainScale: 1.18,
    infoLabel: "Synth lead pulse",
    warnLabel: "Stab rise",
    errorLabel: "Drop surge",
    anomalyLabel: "Sidechain accent",
    descriptor: "punchy festival instrumental",
  },
  techno: {
    label: "Techno",
    infoWaveform: "square",
    warnWaveform: "square",
    errorWaveform: "square",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 0.92,
    durationScale: 0.68,
    gainScale: 1.22,
    infoLabel: "Kick pulse",
    warnLabel: "Clap hit",
    errorLabel: "Distortion burst",
    anomalyLabel: "Glitch accent",
    descriptor: "dense percussive instrumental",
  },
  trance: {
    label: "Trance",
    infoWaveform: "sine",
    warnWaveform: "triangle",
    errorWaveform: "sawtooth",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.08,
    durationScale: 1.18,
    gainScale: 1.0,
    infoLabel: "Pad sweep",
    warnLabel: "Filter tension",
    errorLabel: "Supersaw burst",
    anomalyLabel: "Arpeggio accent",
    descriptor: "euphoric instrumental sweep",
  },
  classic: {
    label: "Classical",
    infoWaveform: "sine",
    warnWaveform: "sine",
    errorWaveform: "triangle",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.12,
    durationScale: 1.6,
    gainScale: 0.78,
    infoLabel: "String bed",
    warnLabel: "Tension phrase",
    errorLabel: "Dramatic swell",
    anomalyLabel: "Dissonance accent",
    descriptor: "orchestral instrumental palette",
  },
  jazz: {
    label: "Jazz",
    infoWaveform: "sine",
    warnWaveform: "triangle",
    errorWaveform: "triangle",
    anomalyWaveform: "triangle",
    noteMultiplier: 0.88,
    durationScale: 1.22,
    gainScale: 0.82,
    infoLabel: "Walking tone",
    warnLabel: "Chord tension",
    errorLabel: "Sharp comp",
    anomalyLabel: "Tritone accent",
    descriptor: "instrumental jazz palette",
  },
  "tropical-house": {
    label: "Tropical House",
    infoWaveform: "sine",
    warnWaveform: "triangle",
    errorWaveform: "triangle",
    anomalyWaveform: "sawtooth",
    noteMultiplier: 1.12,
    durationScale: 0.85,
    gainScale: 1.25,
    infoLabel: "Pluck pulse",
    warnLabel: "Tropical rise",
    errorLabel: "Sunset surge",
    anomalyLabel: "Steel drum accent",
    descriptor: "chill instrumental tropical house",
  },
};

const SEQUENCER_PRESETS: Record<string, SequencerPreset> = {
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

const BALANCED_PRESET: SequencerPreset = {
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

const COMPONENT_PAN_SPREAD = [-0.72, -0.36, -0.12, 0.12, 0.42, 0.74];
const COMPONENT_NOTE_SPREAD = [0.92, 0.96, 1.0, 1.04, 1.08, 1.12];

export function fallbackSequencerPreset(
  presetId: string | null | undefined,
): SequencerPreset {
  return SEQUENCER_PRESETS[presetId ?? ""] ?? SEQUENCER_PRESETS.balanced ?? BALANCED_PRESET;
}

export function withMutationPreset(
  preset: SequencerPreset,
  mutationProfile: MutationProfileOption,
): SequencerPreset {
  const density = Math.max(0.45, mutationProfile.cueDensityMultiplier);
  const spacing = Math.max(0.4, mutationProfile.cueSpacingMultiplier);

  return {
    ...preset,
    maxCuesPerWindow: Math.max(3, Math.round(preset.maxCuesPerWindow * density)),
    scheduleGapMs: Math.max(22, Math.round(preset.scheduleGapMs * spacing)),
    infoGainMultiplier: Number(
      (preset.infoGainMultiplier * mutationProfile.routeGainMultiplier).toFixed(2),
    ),
    warnGainMultiplier: Number(
      (preset.warnGainMultiplier * mutationProfile.routeGainMultiplier).toFixed(2),
    ),
    errorGainMultiplier: Number(
      (preset.errorGainMultiplier * mutationProfile.routeGainMultiplier).toFixed(2),
    ),
    anomalyGainMultiplier: Number(
      (
        preset.anomalyGainMultiplier *
        mutationProfile.routeGainMultiplier *
        mutationProfile.anomalyBoostMultiplier
      ).toFixed(2),
    ),
  };
}

export function resolveComponentRoute(
  component: string,
  knownComponents: readonly string[],
): ComponentRoute {
  const index = knownComponents.indexOf(component);
  if (index < 0) {
    return { component, pan: 0, noteMultiplier: 1.0 };
  }

  const slot = index % COMPONENT_PAN_SPREAD.length;
  return {
    component,
    pan: COMPONENT_PAN_SPREAD[slot] ?? 0,
    noteMultiplier: COMPONENT_NOTE_SPREAD[slot] ?? 1.0,
  };
}

export function hasGenreProfile(genreId: string | null | undefined): genreId is string {
  return Boolean(genreId?.trim() && GENRE_PROFILES[genreId]);
}

export function fallbackGenreProfile(genreId: string | null | undefined): GenreProfile {
  return GENRE_PROFILES[genreId ?? ""] ?? GENRE_PROFILES.house;
}

export function fallbackCategoryProfile(categoryId: string): CategoryProfile {
  return CATEGORY_PROFILES[categoryId] ?? CATEGORY_PROFILES.collection;
}

export function fallbackStrategyProfile(strategy: string): StrategyProfile {
  return STRATEGY_PROFILES[strategy] ?? STRATEGY_PROFILES["layered-pack"];
}

export function clampPan(pan: number): number {
  return Math.max(-1, Math.min(1, pan));
}

export function resolveGenreId(
  styleGenreId: string,
  referenceAnchor: ReferenceAnchor | null | undefined,
): string {
  return hasGenreProfile(referenceAnchor?.musicStyleId)
    ? referenceAnchor.musicStyleId
    : styleGenreId;
}
