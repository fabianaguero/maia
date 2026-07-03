import type { UseSimpleMonitorDeckPresentationStateInput } from "./simpleMonitorDeckPresentationTypes";

export function buildSimpleMonitorDeckPresentationRuntimeInput(
  input: UseSimpleMonitorDeckPresentationStateInput,
): UseSimpleMonitorDeckPresentationStateInput {
  return input;
}

export function buildSimpleMonitorDeckPresentationTailHookArgs(
  input: Pick<
    UseSimpleMonitorDeckPresentationStateInput,
    "liveLines" | "selectedAnomalyId" | "setSelectedAnomalyId"
  >,
) {
  return {
    liveLines: input.liveLines,
    selectedAnomalyId: input.selectedAnomalyId,
    setSelectedAnomalyId: input.setSelectedAnomalyId,
  };
}

export function buildSimpleMonitorDeckPresentationVisualHookArgs(input: {
  state: UseSimpleMonitorDeckPresentationStateInput;
  focusAnomaly: (anomalyId: string) => void;
}) {
  return {
    backgroundAudioRef: input.state.backgroundAudioRef,
    waveformBins: input.state.waveformBins,
    waveformAnomalies: input.state.waveformAnomalies,
    trackWaveProgress: input.state.trackWaveProgress,
    setTrackWaveProgress: input.state.setTrackWaveProgress,
    setTrackElapsedSeconds: input.state.setTrackElapsedSeconds,
    deckDurationSeconds: input.state.deckDurationSeconds,
    deckBpm: input.state.deckBpm,
    activeBeatGrid: input.state.activeBeatGrid,
    logSignalBuffer: input.state.logSignalBuffer,
    selectedAnomalyId: input.state.selectedAnomalyId,
    isConsoleExpanded: input.state.isConsoleExpanded,
    onToggleConsole: input.state.onToggleConsole,
    onSelectAnomalyForFocus: input.focusAnomaly,
    deckVisualPreset: input.state.deckVisualPreset,
    waveformScale: input.state.waveformScale,
    safeRuntime: input.state.safeRuntime ?? false,
  };
}

export function buildSimpleMonitorDeckPresentationHookResult<TTailState, TVisualState>(input: {
  tailState: TTailState;
  visualState: TVisualState;
}): TTailState & TVisualState {
  return {
    ...input.tailState,
    ...input.visualState,
  };
}
