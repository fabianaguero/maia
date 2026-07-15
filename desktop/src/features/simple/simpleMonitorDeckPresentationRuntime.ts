import type { BeatGridPoint } from "../../types/library";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { MonitorLogLine } from "./monitorLogParsing";

export interface BuildSimpleMonitorLiveTailHookInputArgs {
  liveLines: MonitorLogLine[];
  selectedAnomalyId: string | null;
  setSelectedAnomalyId: (anomalyId: string) => void;
  trackWaveProgress: number;
  deckDurationSeconds: number | null;
  onWaveformClick?: (progress: number) => void;
}

export function buildSimpleMonitorLiveTailHookInput(
  input: BuildSimpleMonitorLiveTailHookInputArgs,
) {
  return {
    liveLines: input.liveLines,
    selectedAnomalyId: input.selectedAnomalyId,
    onSelectAnomalyId: input.setSelectedAnomalyId,
    trackWaveProgress: input.trackWaveProgress,
    deckDurationSeconds: input.deckDurationSeconds,
    onWaveformClick: input.onWaveformClick,
  };
}

export interface BuildSimpleMonitorDeckVisualHookInputArgs {
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
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  onSelectAnomalyForFocus: (anomalyId: string) => void;
  deckVisualPreset: "passive" | "balanced" | "alert";
  waveformScale: number;
  safeRuntime: boolean;
}

export function buildSimpleMonitorDeckVisualHookInput(
  input: BuildSimpleMonitorDeckVisualHookInputArgs,
) {
  return {
    backgroundAudioRef: input.backgroundAudioRef,
    waveformBins: input.waveformBins,
    waveformAnomalies: input.waveformAnomalies,
    trackWaveProgress: input.trackWaveProgress,
    setTrackWaveProgress: input.setTrackWaveProgress,
    setTrackElapsedSeconds: input.setTrackElapsedSeconds,
    deckDurationSeconds: input.deckDurationSeconds,
    deckBpm: input.deckBpm,
    activeBeatGrid: input.activeBeatGrid,
    logSignalBuffer: input.logSignalBuffer,
    selectedAnomalyId: input.selectedAnomalyId,
    isConsoleExpanded: input.isConsoleExpanded,
    onToggleConsole: input.onToggleConsole,
    onSelectAnomalyForFocus: input.onSelectAnomalyForFocus,
    deckVisualPreset: input.deckVisualPreset,
    waveformScale: input.waveformScale,
    safeRuntime: input.safeRuntime,
  };
}
