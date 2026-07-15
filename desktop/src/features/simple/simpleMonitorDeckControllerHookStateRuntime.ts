import type { MonitorLogLine } from "./monitorLogParsing";
import {
  buildSimpleMonitorDeckHookState,
  type BuildSimpleMonitorDeckHookStateArgs,
} from "./simpleMonitorDeckRuntime";

export function buildSimpleMonitorDeckControllerHookState(input: {
  activeTrack: BuildSimpleMonitorDeckHookStateArgs["activeTrack"];
  previewTrackId: string | null;
  toggleTrackPreview: BuildSimpleMonitorDeckHookStateArgs["toggleTrackPreview"];
  deckPresetLabel: string;
  streamAdapterLabel: string;
  isMonitorActive: boolean;
  liveLines: MonitorLogLine[];
  selectedAnomalyId: string | null;
  simulateLog: () => void;
  terminalLinesRef: BuildSimpleMonitorDeckHookStateArgs["terminalLinesRef"];
  onTerminalScroll: BuildSimpleMonitorDeckHookStateArgs["onTerminalScroll"];
  registerLineRef: BuildSimpleMonitorDeckHookStateArgs["registerLineRef"];
  focusAnomaly: BuildSimpleMonitorDeckHookStateArgs["focusAnomaly"];
  deckBpm: number | null;
  trackElapsedSeconds: number;
  trackWaveProgress: number;
  deckDurationSeconds: number | null;
  overviewCanvasRef: BuildSimpleMonitorDeckHookStateArgs["overviewCanvasRef"];
  waveformCanvasRef: BuildSimpleMonitorDeckHookStateArgs["waveformCanvasRef"];
  waveformStageRef: BuildSimpleMonitorDeckHookStateArgs["waveformStageRef"];
  anomalyBurstRegions: BuildSimpleMonitorDeckHookStateArgs["anomalyBurstRegions"];
  selectedBurstRegion: BuildSimpleMonitorDeckHookStateArgs["selectedBurstRegion"];
  overviewAnomalyMarkers: BuildSimpleMonitorDeckHookStateArgs["overviewAnomalyMarkers"];
  overviewWindowLeftPercent: number;
  overviewWindowWidthPercent: number;
  overviewPlayheadLeftPercent: number;
  handleOverviewPointerDown: BuildSimpleMonitorDeckHookStateArgs["handleOverviewPointerDown"];
  handleOverviewClick: BuildSimpleMonitorDeckHookStateArgs["handleOverviewClick"];
  handleOverviewAnomalyClick: BuildSimpleMonitorDeckHookStateArgs["handleOverviewAnomalyClick"];
  handleOverviewAnomalyPointerDown: BuildSimpleMonitorDeckHookStateArgs["handleOverviewAnomalyPointerDown"];
  selectedDeckMarker: BuildSimpleMonitorDeckHookStateArgs["selectedDeckMarker"];
  deckTimelineMarkers: BuildSimpleMonitorDeckHookStateArgs["deckTimelineMarkers"];
  deckBeatMarkers: BuildSimpleMonitorDeckHookStateArgs["deckBeatMarkers"];
  handleStagePointerDown: BuildSimpleMonitorDeckHookStateArgs["handleStagePointerDown"];
  handleStageClick: BuildSimpleMonitorDeckHookStateArgs["handleStageClick"];
  waveformScale: number;
}) {
  return buildSimpleMonitorDeckHookState({
    activeTrack: input.activeTrack,
    previewTrackId: input.previewTrackId,
    toggleTrackPreview: input.toggleTrackPreview,
    deckPresetLabel: input.deckPresetLabel,
    streamAdapterLabel: input.streamAdapterLabel,
    isMonitorActive: input.isMonitorActive,
    liveLines: input.liveLines,
    selectedAnomalyId: input.selectedAnomalyId,
    simulateLog: input.simulateLog,
    terminalLinesRef: input.terminalLinesRef,
    onTerminalScroll: input.onTerminalScroll,
    registerLineRef: input.registerLineRef,
    focusAnomaly: input.focusAnomaly,
    deckBpm: input.deckBpm,
    trackElapsedSeconds: input.trackElapsedSeconds,
    trackWaveProgress: input.trackWaveProgress,
    deckDurationSeconds: input.deckDurationSeconds,
    overviewCanvasRef: input.overviewCanvasRef,
    waveformCanvasRef: input.waveformCanvasRef,
    waveformStageRef: input.waveformStageRef,
    anomalyBurstRegions: input.anomalyBurstRegions,
    selectedBurstRegion: input.selectedBurstRegion,
    overviewAnomalyMarkers: input.overviewAnomalyMarkers,
    overviewWindowLeftPercent: input.overviewWindowLeftPercent,
    overviewWindowWidthPercent: input.overviewWindowWidthPercent,
    overviewPlayheadLeftPercent: input.overviewPlayheadLeftPercent,
    handleOverviewPointerDown: input.handleOverviewPointerDown,
    handleOverviewClick: input.handleOverviewClick,
    handleOverviewAnomalyClick: input.handleOverviewAnomalyClick,
    handleOverviewAnomalyPointerDown: input.handleOverviewAnomalyPointerDown,
    selectedDeckMarker: input.selectedDeckMarker,
    deckTimelineMarkers: input.deckTimelineMarkers,
    deckBeatMarkers: input.deckBeatMarkers,
    handleStagePointerDown: input.handleStagePointerDown,
    handleStageClick: input.handleStageClick,
    waveformScale: input.waveformScale,
  });
}
