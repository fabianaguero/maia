import type { GenreProfile } from "./liveSonificationSceneProfileData";

export const ACOUSTIC_GENRE_PROFILES: Record<string, GenreProfile> = {
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
};
