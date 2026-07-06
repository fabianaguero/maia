import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";

export interface UseMonitorDeckScrubOptions {
  backgroundAudioRef: { current: HTMLAudioElement | null };
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  onSelectAnomalyForFocus: (anomalyId: string) => void;
}
