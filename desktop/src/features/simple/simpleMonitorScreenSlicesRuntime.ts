import type { useSimpleMonitorDeckRuntime } from "./useSimpleMonitorDeckRuntime";
import type { useSimpleMonitorLaunchState } from "./useSimpleMonitorLaunchState";

type LaunchStateSlice = ReturnType<typeof useSimpleMonitorLaunchState>;
type DeckRuntimeSlice = ReturnType<typeof useSimpleMonitorDeckRuntime>;

export function buildSimpleMonitorLaunchStateSlice(
  launchState: LaunchStateSlice,
): LaunchStateSlice {
  return {
    selectedSoundId: launchState.selectedSoundId,
    setSelectedSoundId: launchState.setSelectedSoundId,
    filteredMonitorSourceOptions: launchState.filteredMonitorSourceOptions,
    selectedSourceOption: launchState.selectedSourceOption,
    canStartSelectedSource: launchState.canStartSelectedSource,
    sourceEmptyMessage: launchState.sourceEmptyMessage,
    startHint: launchState.startHint,
    selectedSourceId: launchState.selectedSourceId,
    setSelectedSourceId: launchState.setSelectedSourceId,
    sourceFilter: launchState.sourceFilter,
    setSourceFilter: launchState.setSourceFilter,
    isLaunchingMonitor: launchState.isLaunchingMonitor,
    handleStartMonitoringRequest: launchState.handleStartMonitoringRequest,
  };
}

export function buildSimpleMonitorDeckRuntimeSlice(
  deckRuntime: DeckRuntimeSlice,
): DeckRuntimeSlice {
  return {
    activeTrack: deckRuntime.activeTrack,
    previewTrackId: deckRuntime.previewTrackId,
    toggleTrackPreview: deckRuntime.toggleTrackPreview,
    deckPresetLabel: deckRuntime.deckPresetLabel,
    streamAdapterLabel: deckRuntime.streamAdapterLabel,
    isMonitorActive: deckRuntime.isMonitorActive,
    liveLines: deckRuntime.liveLines,
    selectedAnomalyId: deckRuntime.selectedAnomalyId,
    simulateLog: deckRuntime.simulateLog,
    terminalLinesRef: deckRuntime.terminalLinesRef,
    onTerminalScroll: deckRuntime.onTerminalScroll,
    registerLineRef: deckRuntime.registerLineRef,
    focusAnomaly: deckRuntime.focusAnomaly,
    deckBpm: deckRuntime.deckBpm,
    trackElapsedSeconds: deckRuntime.trackElapsedSeconds,
    deckDurationSeconds: deckRuntime.deckDurationSeconds,
    overviewCanvasRef: deckRuntime.overviewCanvasRef,
    waveformCanvasRef: deckRuntime.waveformCanvasRef,
    waveformStageRef: deckRuntime.waveformStageRef,
    anomalyBurstRegions: deckRuntime.anomalyBurstRegions,
    selectedBurstRegion: deckRuntime.selectedBurstRegion,
    overviewAnomalyMarkers: deckRuntime.overviewAnomalyMarkers,
    overviewWindowLeftPercent: deckRuntime.overviewWindowLeftPercent,
    overviewWindowWidthPercent: deckRuntime.overviewWindowWidthPercent,
    overviewPlayheadLeftPercent: deckRuntime.overviewPlayheadLeftPercent,
    handleOverviewPointerDown: deckRuntime.handleOverviewPointerDown,
    handleOverviewClick: deckRuntime.handleOverviewClick,
    handleOverviewAnomalyClick: deckRuntime.handleOverviewAnomalyClick,
    handleOverviewAnomalyPointerDown: deckRuntime.handleOverviewAnomalyPointerDown,
    selectedDeckMarker: deckRuntime.selectedDeckMarker,
    deckTimelineMarkers: deckRuntime.deckTimelineMarkers,
    deckBeatMarkers: deckRuntime.deckBeatMarkers,
    handleStagePointerDown: deckRuntime.handleStagePointerDown,
    handleStageClick: deckRuntime.handleStageClick,
    waveformScale: deckRuntime.waveformScale,
  };
}
