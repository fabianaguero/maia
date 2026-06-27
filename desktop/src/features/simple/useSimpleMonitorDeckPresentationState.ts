import type { BeatGridPoint } from "../../types/library";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import { useSimpleMonitorDeckVisualState } from "./useSimpleMonitorDeckVisualState";
import { useSimpleMonitorLiveTail } from "./useSimpleMonitorLiveTail";
import {
  buildSimpleMonitorDeckVisualHookInput,
  buildSimpleMonitorLiveTailHookInput,
} from "./simpleMonitorDeckPresentationRuntime";

interface UseSimpleMonitorDeckPresentationStateInput {
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
  liveLines: Array<{
    id: string;
    anomalyId?: string | null;
  }>;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  deckVisualPreset: "passive" | "balanced" | "alert";
  waveformScale: number;
  safeRuntime?: boolean;
}

export function useSimpleMonitorDeckPresentationState({
  backgroundAudioRef,
  waveformBins,
  waveformAnomalies,
  trackWaveProgress,
  setTrackWaveProgress,
  setTrackElapsedSeconds,
  deckDurationSeconds,
  deckBpm,
  activeBeatGrid,
  logSignalBuffer,
  selectedAnomalyId,
  setSelectedAnomalyId,
  liveLines,
  isConsoleExpanded,
  onToggleConsole,
  deckVisualPreset,
  waveformScale,
  safeRuntime = false,
}: UseSimpleMonitorDeckPresentationStateInput) {
  const tailState = useSimpleMonitorLiveTail(
    buildSimpleMonitorLiveTailHookInput({
      liveLines: liveLines as never,
      selectedAnomalyId,
      setSelectedAnomalyId,
    }),
  );
  const visualState = useSimpleMonitorDeckVisualState(
    buildSimpleMonitorDeckVisualHookInput({
      backgroundAudioRef,
      waveformBins,
      waveformAnomalies,
      trackWaveProgress,
      setTrackWaveProgress,
      setTrackElapsedSeconds,
      deckDurationSeconds,
      deckBpm,
      activeBeatGrid,
      logSignalBuffer,
      selectedAnomalyId,
      isConsoleExpanded,
      onToggleConsole,
      onSelectAnomalyForFocus: tailState.focusAnomaly,
      deckVisualPreset,
      waveformScale,
      safeRuntime,
    }),
  );

  return {
    ...tailState,
    ...visualState,
  };
}
