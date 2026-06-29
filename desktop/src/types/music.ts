export interface MusicStyleOption {
  id: string;
  label: string;
  description: string;
  minBpm: number;
  maxBpm: number;
}

export interface MusicStyleCatalog {
  defaultTrackMusicStyleId: string;
  musicStyles: MusicStyleOption[];
}

export interface StyleProfileOption {
  id: string;
  label: string;
  description: string;
  genreId: string;
  presetId: string;
  backgroundGain: number;
  filterBaseHz: number;
  filterCeilingHz: number;
  playlistCrossfadeSeconds: number;
  transitionFeel: "smooth" | "steady" | "tight";
}

export type MutationArrangementDepth = "minimal" | "full" | "stacked";

export interface MutationProfileOption {
  id: string;
  label: string;
  description: string;
  cueDensityMultiplier: number;
  cueSpacingMultiplier: number;
  noteMotionMultiplier: number;
  routeGainMultiplier: number;
  anomalyBoostMultiplier: number;
  backgroundDucking: number;
  filterSweepMultiplier: number;
  arrangementDepth: MutationArrangementDepth;
  transitionTightness: number;
}
