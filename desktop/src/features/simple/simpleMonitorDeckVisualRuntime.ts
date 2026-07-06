import type { BeatGridPoint } from "../../types/library";
import {
  buildDeckBeatMarkers,
  buildDeckTimelineMarkers,
  buildMonitorDeckDerivedState,
  resolveVisibleWindowSeconds,
  sampleTrackWaveWindow,
  type WaveformAnomalyMarker,
} from "./monitorDeckViewModel";

export interface BuildSimpleMonitorDeckVisualDerivedStateInput {
  waveformBins?: number[] | null;
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  deckDurationSeconds: number | null;
  deckBpm: number | null;
  activeBeatGrid: BeatGridPoint[] | null;
  logSignalBuffer: Array<{ val: number; heat: number }>;
  selectedAnomalyId: string | null;
}

export function buildSimpleMonitorDeckVisualDerivedState(
  input: BuildSimpleMonitorDeckVisualDerivedStateInput,
) {
  const visibleWindowSeconds = resolveVisibleWindowSeconds(input.deckBpm, input.activeBeatGrid);
  const trackWaveSamples = sampleTrackWaveWindow(
    input.waveformBins ?? null,
    input.trackWaveProgress,
    input.deckDurationSeconds,
    input.deckBpm,
    input.activeBeatGrid,
  );
  const deckTimelineMarkers = buildDeckTimelineMarkers(
    input.trackWaveProgress,
    input.deckDurationSeconds,
    input.deckBpm,
    input.activeBeatGrid,
  );
  const deckBeatMarkers = buildDeckBeatMarkers(
    input.trackWaveProgress,
    input.deckDurationSeconds,
    input.deckBpm,
    input.activeBeatGrid,
  );
  const derivedDeckState = buildMonitorDeckDerivedState({
    waveformBins: input.waveformBins ?? null,
    waveformAnomalies: input.waveformAnomalies,
    trackWaveProgress: input.trackWaveProgress,
    deckDurationSeconds: input.deckDurationSeconds,
    visibleWindowSeconds,
    logSignalBuffer: input.logSignalBuffer,
    selectedAnomalyId: input.selectedAnomalyId,
  });

  return {
    visibleWindowSeconds,
    trackWaveSamples,
    deckTimelineMarkers,
    deckBeatMarkers,
    derivedDeckState,
  };
}

export interface BuildMonitorDeckScrubHookInputArgs {
  backgroundAudioRef: { current: HTMLAudioElement | null };
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  onSelectAnomalyForFocus: (anomalyId: string) => void;
}
