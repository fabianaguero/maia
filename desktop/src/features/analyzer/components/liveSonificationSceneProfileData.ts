export interface CategoryProfile {
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

export interface StrategyProfile {
  noteMultiplier: number;
  durationScale: number;
  gainScale: number;
  panBias: number;
  descriptor: string;
}

export interface GenreProfile {
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

export { CATEGORY_PROFILES } from "./liveSonificationCategoryProfileData";
export { STRATEGY_PROFILES } from "./liveSonificationStrategyProfileData";
export { GENRE_PROFILES } from "./liveSonificationGenreProfileData";
export {
  BALANCED_PRESET,
  COMPONENT_NOTE_SPREAD,
  COMPONENT_PAN_SPREAD,
  SEQUENCER_PRESETS,
} from "./liveSonificationSequencerPresetData";
