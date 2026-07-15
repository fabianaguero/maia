import type { BuildSimpleMonitorDeckHookStateArgs } from "./simpleMonitorDeckHookStateRuntime";
import type { SimpleMonitorDeckLiveControllerResult } from "./simpleMonitorDeckLiveControllerTypes";
import type { SimpleMonitorDeckRuntimeState } from "./simpleMonitorDeckRuntime";
import type { SimpleMonitorDeckPlaybackStateSlice } from "./simpleMonitorDeckControllerHookTypes";

export function buildSimpleMonitorDeckControllerHookResultArgs(input: {
  controllerModel: Pick<
    SimpleMonitorDeckRuntimeState,
    | "activeTrack"
    | "deckPresetLabel"
    | "streamAdapterLabel"
    | "isMonitorActive"
    | "deckDurationSeconds"
  >;
  playback: Pick<
    SimpleMonitorDeckPlaybackStateSlice,
    "trackElapsedSeconds" | "trackWaveProgress"
  >;
  liveState: Pick<
    SimpleMonitorDeckLiveControllerResult,
    "previewTrackId" | "toggleTrackPreview" | "liveLines" | "selectedAnomalyId" | "simulateLog"
  >;
  presentationState: Omit<
    BuildSimpleMonitorDeckHookStateArgs,
    | "activeTrack"
    | "previewTrackId"
    | "toggleTrackPreview"
    | "deckPresetLabel"
    | "streamAdapterLabel"
    | "isMonitorActive"
    | "liveLines"
    | "selectedAnomalyId"
    | "simulateLog"
    | "deckBpm"
    | "trackElapsedSeconds"
    | "trackWaveProgress"
    | "deckDurationSeconds"
    | "waveformScale"
  >;
  deckBpm: number | null;
  waveformScale: number;
}): BuildSimpleMonitorDeckHookStateArgs {
  return {
    activeTrack: input.controllerModel.activeTrack,
    previewTrackId: input.liveState.previewTrackId,
    toggleTrackPreview: input.liveState.toggleTrackPreview,
    deckPresetLabel: input.controllerModel.deckPresetLabel,
    streamAdapterLabel: input.controllerModel.streamAdapterLabel,
    isMonitorActive: input.controllerModel.isMonitorActive,
    liveLines: input.liveState.liveLines,
    selectedAnomalyId: input.liveState.selectedAnomalyId,
    simulateLog: input.liveState.simulateLog,
    terminalLinesRef: input.presentationState.terminalLinesRef,
    onTerminalScroll: input.presentationState.onTerminalScroll,
    registerLineRef: input.presentationState.registerLineRef,
    focusAnomaly: input.presentationState.focusAnomaly,
    deckBpm: input.deckBpm,
    trackElapsedSeconds: input.playback.trackElapsedSeconds,
    trackWaveProgress: input.playback.trackWaveProgress,
    deckDurationSeconds: input.controllerModel.deckDurationSeconds,
    overviewCanvasRef: input.presentationState.overviewCanvasRef,
    waveformCanvasRef: input.presentationState.waveformCanvasRef,
    waveformStageRef: input.presentationState.waveformStageRef,
    anomalyBurstRegions: input.presentationState.anomalyBurstRegions,
    selectedBurstRegion: input.presentationState.selectedBurstRegion,
    overviewAnomalyMarkers: input.presentationState.overviewAnomalyMarkers,
    overviewWindowLeftPercent: input.presentationState.overviewWindowLeftPercent,
    overviewWindowWidthPercent: input.presentationState.overviewWindowWidthPercent,
    overviewPlayheadLeftPercent: input.presentationState.overviewPlayheadLeftPercent,
    handleOverviewPointerDown: input.presentationState.handleOverviewPointerDown,
    handleOverviewClick: input.presentationState.handleOverviewClick,
    handleOverviewAnomalyClick: input.presentationState.handleOverviewAnomalyClick,
    handleOverviewAnomalyPointerDown: input.presentationState.handleOverviewAnomalyPointerDown,
    selectedDeckMarker: input.presentationState.selectedDeckMarker,
    deckTimelineMarkers: input.presentationState.deckTimelineMarkers,
    deckBeatMarkers: input.presentationState.deckBeatMarkers,
    handleStagePointerDown: input.presentationState.handleStagePointerDown,
    handleStageClick: input.presentationState.handleStageClick,
    waveformScale: input.waveformScale,
  };
}
