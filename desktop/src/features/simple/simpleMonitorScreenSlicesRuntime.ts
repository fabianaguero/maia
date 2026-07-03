import type {
  Dispatch,
  SetStateAction,
  UIEvent as ReactUIEvent,
} from "react";
import type { MonitorLaunchSource, MonitorSourceFilter } from "./monitorSourceOptions";
import type { MonitorLogLine } from "./monitorLogParsing";
import type { BuildSimpleMonitorDeckHookStateArgs } from "./simpleMonitorDeckHookStateRuntime";

export interface SimpleMonitorLaunchStateSlice {
  selectedSoundId: string;
  setSelectedSoundId: Dispatch<SetStateAction<string>>;
  filteredMonitorSourceOptions: MonitorLaunchSource[];
  selectedSourceOption: MonitorLaunchSource | null;
  canStartSelectedSource: boolean;
  sourceEmptyMessage: string;
  startHint: string;
  selectedSourceId: string;
  setSelectedSourceId: Dispatch<SetStateAction<string>>;
  sourceFilter: MonitorSourceFilter;
  setSourceFilter: Dispatch<SetStateAction<MonitorSourceFilter>>;
  isLaunchingMonitor: boolean;
  handleStartMonitoringRequest: () => Promise<void>;
}

export interface SimpleMonitorDeckRuntimeSlice {
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
  onTerminalScroll: (event: ReactUIEvent<HTMLDivElement>) => void;
  registerLineRef: BuildSimpleMonitorDeckHookStateArgs["registerLineRef"];
  focusAnomaly: BuildSimpleMonitorDeckHookStateArgs["focusAnomaly"];
  deckBpm: number | null;
  trackElapsedSeconds: number;
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
  handleOverviewAnomalyPointerDown:
    BuildSimpleMonitorDeckHookStateArgs["handleOverviewAnomalyPointerDown"];
  selectedDeckMarker: BuildSimpleMonitorDeckHookStateArgs["selectedDeckMarker"];
  deckTimelineMarkers: BuildSimpleMonitorDeckHookStateArgs["deckTimelineMarkers"];
  deckBeatMarkers: BuildSimpleMonitorDeckHookStateArgs["deckBeatMarkers"];
  handleStagePointerDown: BuildSimpleMonitorDeckHookStateArgs["handleStagePointerDown"];
  handleStageClick: BuildSimpleMonitorDeckHookStateArgs["handleStageClick"];
  waveformScale: number;
}

export function buildSimpleMonitorLaunchStateSlice(
  launchState: SimpleMonitorLaunchStateSlice,
): SimpleMonitorLaunchStateSlice {
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
  deckRuntime: SimpleMonitorDeckRuntimeSlice,
): SimpleMonitorDeckRuntimeSlice {
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
