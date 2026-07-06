export interface SimpleMonitorDeckPlaybackStateSlice {
  trackWaveProgress: number;
  setTrackWaveProgress: (value: number) => void;
  trackElapsedSeconds: number;
  setTrackElapsedSeconds: (value: number) => void;
  trackDurationSeconds: number | null;
  setTrackDurationSeconds: (value: number | null) => void;
  trackWaveProgressRef: { current: number };
}
