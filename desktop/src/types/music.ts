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
