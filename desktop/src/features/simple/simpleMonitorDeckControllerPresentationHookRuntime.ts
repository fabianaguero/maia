import type { MonitorDeckControls } from "./monitorDeckControls";
import type { BuildSimpleMonitorDeckControllerPresentationInputArgs } from "./simpleMonitorDeckControllerRuntime";
import type { UseSimpleMonitorDeckRuntimeInput } from "./simpleMonitorDeckRuntimeTypes";
import type { SimpleMonitorDeckLiveControllerResult } from "./simpleMonitorDeckLiveControllerTypes";
import type { SimpleMonitorDeckRuntimeState } from "./simpleMonitorDeckRuntime";
import type { SimpleMonitorDeckPlaybackStateSlice } from "./simpleMonitorDeckControllerHookTypes";

export function buildSimpleMonitorDeckControllerPresentationHookArgs(input: {
  state: UseSimpleMonitorDeckRuntimeInput;
  deckControls: MonitorDeckControls;
  controllerModel: Pick<
    SimpleMonitorDeckRuntimeState,
    "deckDurationSeconds" | "activeBeatGrid" | "deckVisualPreset"
  >;
  playback: Pick<
    SimpleMonitorDeckPlaybackStateSlice,
    "trackWaveProgress" | "setTrackWaveProgress" | "setTrackElapsedSeconds"
  >;
  liveState: Pick<
    SimpleMonitorDeckLiveControllerResult,
    | "backgroundAudioRef"
    | "waveformAnomalies"
    | "logSignalBuffer"
    | "selectedAnomalyId"
    | "setSelectedAnomalyId"
    | "liveLines"
  >;
  deckBpm: number | null;
  safeRuntime: boolean;
}): BuildSimpleMonitorDeckControllerPresentationInputArgs {
  return {
    backgroundAudioRef: input.liveState.backgroundAudioRef,
    waveformBins: input.state.waveformBins,
    waveformAnomalies: input.liveState.waveformAnomalies,
    trackWaveProgress: input.playback.trackWaveProgress,
    setTrackWaveProgress: input.playback.setTrackWaveProgress,
    setTrackElapsedSeconds: input.playback.setTrackElapsedSeconds,
    deckDurationSeconds: input.controllerModel.deckDurationSeconds,
    deckBpm: input.deckBpm,
    activeBeatGrid: input.controllerModel.activeBeatGrid,
    logSignalBuffer: input.liveState.logSignalBuffer,
    selectedAnomalyId: input.liveState.selectedAnomalyId,
    setSelectedAnomalyId: input.liveState.setSelectedAnomalyId,
    liveLines: input.liveState.liveLines,
    isConsoleExpanded: input.state.isConsoleExpanded,
    onToggleConsole: input.state.onToggleConsole,
    deckVisualPreset: input.controllerModel.deckVisualPreset,
    waveformScale: input.deckControls.waveformScale,
    safeRuntime: input.safeRuntime ?? false,
  };
}
