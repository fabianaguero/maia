import type {
  MutationProfileOption,
  StyleProfileOption,
} from "../types/music";

export const STYLE_PROFILES: StyleProfileOption[] = [
  {
    id: "steady-house",
    label: "Steady House",
    description: "Warm, stable groove for long background listening with soft movement.",
    genreId: "house",
    presetId: "balanced",
    backgroundGain: 0.9,
    filterBaseHz: 18000,
    filterCeilingHz: 22000,
    playlistCrossfadeSeconds: 6.8,
    transitionFeel: "steady",
  },
  {
    id: "deep-night",
    label: "Deep Night",
    description: "Lower-energy late-night bed with restrained cues and softer highs.",
    genreId: "melodic-house",
    presetId: "sparse",
    backgroundGain: 0.78,
    filterBaseHz: 12000,
    filterCeilingHz: 18000,
    playlistCrossfadeSeconds: 8.2,
    transitionFeel: "smooth",
  },
  {
    id: "ambient-watch",
    label: "Ambient Watch",
    description: "Diffuse monitoring bed where anomalies cut through without crowding the mix.",
    genreId: "classic",
    presetId: "sparse",
    backgroundGain: 0.72,
    filterBaseHz: 9000,
    filterCeilingHz: 14000,
    playlistCrossfadeSeconds: 9.4,
    transitionFeel: "smooth",
  },
  {
    id: "alert-techno",
    label: "Alert Techno",
    description: "Tighter beat-locked booth feel where operational spikes hit harder.",
    genreId: "techno",
    presetId: "beat-locked",
    backgroundGain: 0.84,
    filterBaseHz: 16000,
    filterCeilingHz: 22000,
    playlistCrossfadeSeconds: 4.8,
    transitionFeel: "tight",
  },
];

export const DEFAULT_STYLE_PROFILE_ID = "steady-house";

export const MUTATION_PROFILES: MutationProfileOption[] = [
  {
    id: "subtle",
    label: "Subtle",
    description: "Protects the base track; only stronger source changes break through.",
    cueDensityMultiplier: 0.65,
    cueSpacingMultiplier: 1.35,
    noteMotionMultiplier: 0.96,
    routeGainMultiplier: 0.82,
    anomalyBoostMultiplier: 1.06,
    backgroundDucking: 0.08,
    filterSweepMultiplier: 0.8,
    arrangementDepth: "minimal",
    transitionTightness: 0.88,
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Keeps the original groove intact while making source pressure audible.",
    cueDensityMultiplier: 1,
    cueSpacingMultiplier: 1,
    noteMotionMultiplier: 1,
    routeGainMultiplier: 1,
    anomalyBoostMultiplier: 1.12,
    backgroundDucking: 0.14,
    filterSweepMultiplier: 1,
    arrangementDepth: "full",
    transitionTightness: 1,
  },
  {
    id: "reactive",
    label: "Reactive",
    description: "Pushes more movement into the track so source changes are clearly felt.",
    cueDensityMultiplier: 1.24,
    cueSpacingMultiplier: 0.82,
    noteMotionMultiplier: 1.08,
    routeGainMultiplier: 1.12,
    anomalyBoostMultiplier: 1.24,
    backgroundDucking: 0.2,
    filterSweepMultiplier: 1.25,
    arrangementDepth: "full",
    transitionTightness: 1.12,
  },
  {
    id: "volatile",
    label: "Volatile",
    description: "High mutation depth with denser voicing and stronger anomaly emphasis.",
    cueDensityMultiplier: 1.5,
    cueSpacingMultiplier: 0.66,
    noteMotionMultiplier: 1.16,
    routeGainMultiplier: 1.22,
    anomalyBoostMultiplier: 1.36,
    backgroundDucking: 0.28,
    filterSweepMultiplier: 1.5,
    arrangementDepth: "stacked",
    transitionTightness: 1.26,
  },
];

export const DEFAULT_MUTATION_PROFILE_ID = "balanced";

export function resolveStyleProfile(
  styleProfileId: string | null | undefined,
): StyleProfileOption {
  return (
    STYLE_PROFILES.find((profile) => profile.id === styleProfileId) ??
    STYLE_PROFILES.find((profile) => profile.id === DEFAULT_STYLE_PROFILE_ID) ??
    STYLE_PROFILES[0]
  );
}

export function resolveMutationProfile(
  mutationProfileId: string | null | undefined,
): MutationProfileOption {
  return (
    MUTATION_PROFILES.find((profile) => profile.id === mutationProfileId) ??
    MUTATION_PROFILES.find((profile) => profile.id === DEFAULT_MUTATION_PROFILE_ID) ??
    MUTATION_PROFILES[0]
  );
}
