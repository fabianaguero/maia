import { buildSimpleMonitorDeckControllerHookResultArgs } from "./simpleMonitorDeckControllerHookRuntime";
import { buildSimpleMonitorDeckControllerHookState } from "./simpleMonitorDeckControllerRuntime";
import type { UseSimpleMonitorDeckRuntimeInput } from "./simpleMonitorDeckRuntimeTypes";
import { useSimpleMonitorDeckControllerSlices } from "./useSimpleMonitorDeckControllerSlices";

export function useSimpleMonitorDeckController({
  skin,
  session,
  isListening,
  isLaunchingMonitor,
  safeTracks,
  trackName,
  audioContext,
  subscribe,
  waveformBins,
  isConsoleExpanded,
  onToggleConsole,
  liveSettings,
  t,
}: UseSimpleMonitorDeckRuntimeInput) {
  const { deckControls, playbackState, controllerModel, liveState, deckBpm, presentationState } =
    useSimpleMonitorDeckControllerSlices({
      skin,
      session,
      isListening,
      isLaunchingMonitor,
      safeTracks,
      trackName,
      audioContext,
      subscribe,
      waveformBins,
      isConsoleExpanded,
      onToggleConsole,
      liveSettings,
      t,
    });

  return buildSimpleMonitorDeckControllerHookState(
    buildSimpleMonitorDeckControllerHookResultArgs({
      controllerModel,
      playback: {
        trackElapsedSeconds: playbackState.trackElapsedSeconds,
        trackWaveProgress: playbackState.trackWaveProgress,
      },
      liveState: {
        previewTrackId: liveState.previewTrackId,
        toggleTrackPreview: liveState.toggleTrackPreview,
        liveLines: liveState.liveLines,
        selectedAnomalyId: liveState.selectedAnomalyId,
        simulateLog: liveState.simulateLog,
      },
      presentationState: {
        terminalLinesRef: presentationState.terminalLinesRef,
        onTerminalScroll: presentationState.onTerminalScroll,
        registerLineRef: presentationState.registerLineRef,
        focusAnomaly: presentationState.focusAnomaly,
        overviewCanvasRef: presentationState.overviewCanvasRef,
        waveformCanvasRef: presentationState.waveformCanvasRef,
        waveformStageRef: presentationState.waveformStageRef,
        handleOverviewPointerDown: presentationState.handleOverviewPointerDown,
        handleOverviewClick: presentationState.handleOverviewClick,
        handleOverviewAnomalyClick: presentationState.handleOverviewAnomalyClick,
        handleOverviewAnomalyPointerDown: presentationState.handleOverviewAnomalyPointerDown,
        handleStagePointerDown: presentationState.handleStagePointerDown,
        handleStageClick: presentationState.handleStageClick,
        anomalyBurstRegions: presentationState.anomalyBurstRegions,
        overviewWindowWidthPercent: presentationState.overviewWindowWidthPercent,
        overviewWindowLeftPercent: presentationState.overviewWindowLeftPercent,
        overviewPlayheadLeftPercent: presentationState.overviewPlayheadLeftPercent,
        overviewAnomalyMarkers: presentationState.overviewAnomalyMarkers,
        selectedDeckMarker: presentationState.selectedDeckMarker,
        selectedBurstRegion: presentationState.selectedBurstRegion,
        deckTimelineMarkers: presentationState.deckTimelineMarkers,
        deckBeatMarkers: presentationState.deckBeatMarkers,
      },
      deckBpm,
      waveformScale: deckControls.waveformScale,
    }),
  );
}
