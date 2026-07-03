import type { BeatGridPoint } from "../../types/library";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";

export interface UseSimpleMonitorDeckVisualStateInput {
  backgroundAudioRef: { current: HTMLAudioElement | null };
  waveformBins?: number[] | null;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  deckDurationSeconds: number | null;
  deckBpm: number | null;
  activeBeatGrid: BeatGridPoint[] | null;
  logSignalBuffer: Array<{ val: number; heat: number }>;
  selectedAnomalyId: string | null;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  onSelectAnomalyForFocus: (anomalyId: string) => void;
  deckVisualPreset: "passive" | "balanced" | "alert";
  waveformScale: number;
  safeRuntime?: boolean;
}
