import type { BeatGridPoint } from "../../types/library";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { MonitorLogLine } from "./monitorLogParsing";

export interface UseSimpleMonitorDeckPresentationStateInput {
  backgroundAudioRef: { current: HTMLAudioElement | null };
  waveformBins?: number[];
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  deckDurationSeconds: number | null;
  deckBpm: number | null;
  activeBeatGrid: BeatGridPoint[] | null;
  logSignalBuffer: Array<{ val: number; heat: number }>;
  selectedAnomalyId: string | null;
  setSelectedAnomalyId: (anomalyId: string) => void;
  liveLines: MonitorLogLine[];
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  deckVisualPreset: "passive" | "balanced" | "alert";
  waveformScale: number;
  safeRuntime?: boolean;
}
