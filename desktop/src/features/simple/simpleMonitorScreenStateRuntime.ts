import type { AppTranslations } from "../../i18n/en";
import type { PersistedSession } from "../../api/sessions";
import type { LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type {
  ActiveMonitorSession,
  MonitorMetrics,
} from "../monitor/monitorContextTypes";
import { getTrackTitle as getLibraryTrackTitle } from "../../utils/track";
import {
  buildSimpleMonitorScreenViewModel,
  coerceSimpleMonitorCollection,
} from "./simpleMonitorViewModel";
import type { useSimpleMonitorDeckRuntime } from "./useSimpleMonitorDeckRuntime";
import type { useSimpleMonitorLaunchState } from "./useSimpleMonitorLaunchState";
import type { BuildSimpleMonitorScreenHookStateArgs } from "./simpleMonitorScreenRuntime";

type LaunchStateSlice = ReturnType<typeof useSimpleMonitorLaunchState>;
type DeckRuntimeSlice = ReturnType<typeof useSimpleMonitorDeckRuntime>;

export interface SimpleMonitorCollectionsState {
  safePastSessions: PersistedSession[];
  safeRepositories: RepositoryAnalysis[];
  safeTracks: LibraryTrack[];
}

export function getSimpleMonitorTrackTitle(track: LibraryTrack): string {
  return getLibraryTrackTitle(track);
}

export function buildSimpleMonitorCollectionsState(input: {
  pastSessions: PersistedSession[];
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
}): SimpleMonitorCollectionsState {
  return {
    safePastSessions: coerceSimpleMonitorCollection(input.pastSessions),
    safeRepositories: coerceSimpleMonitorCollection(input.repositories),
    safeTracks: coerceSimpleMonitorCollection(input.tracks),
  };
}

export function buildSimpleMonitorScreenHookStateArgs(input: {
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  t: AppTranslations;
  nowMs: number;
  trackName?: string;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  onStop: () => void;
  onRefresh: () => void;
  onSimulateLog: () => void;
  onResumeAudio: () => Promise<void> | void;
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
  isAnomalyFilterActive: boolean;
  onToggleAnomalyFilter: () => void;
  onClearAnomalyFilter: () => void;
  launchState: LaunchStateSlice;
  deckRuntime: DeckRuntimeSlice;
  collections: SimpleMonitorCollectionsState;
  audioStatus: AudioContextState;
}): BuildSimpleMonitorScreenHookStateArgs {
  const screenViewModel = buildSimpleMonitorScreenViewModel({
    session: input.session,
    launchingSource: input.launchState.selectedSourceOption,
    isLaunchingMonitor: input.launchState.isLaunchingMonitor,
    selectedSoundId: input.launchState.selectedSoundId,
    tracks: input.collections.safeTracks,
    trackName: input.trackName,
    t: input.t,
    nowMs: input.nowMs,
    totalAnomalies: input.metrics.totalAnomalies,
    trackElapsedSeconds: input.deckRuntime.trackElapsedSeconds,
    deckDurationSeconds: input.deckRuntime.deckDurationSeconds,
  });

  return {
    isMonitorActive: input.deckRuntime.isMonitorActive,
    isConnectingMonitor: screenViewModel.isConnectingMonitor,
    monitorSourceTitle: screenViewModel.monitorSourceTitle,
    monitorSourcePath: screenViewModel.monitorSourcePath,
    isAnomalyFilterActive: input.isAnomalyFilterActive,
    onToggleAnomalyFilter: input.onToggleAnomalyFilter,
    onClearAnomalyFilter: input.onClearAnomalyFilter,
    totalAnomalies: input.metrics.totalAnomalies,
    uptimeLabel: screenViewModel.uptimeLabel,
    onStop: input.onStop,
    isConsoleExpanded: input.isConsoleExpanded,
    onToggleConsole: input.onToggleConsole,
    onRefresh: input.onRefresh,
    onSimulateLog: input.onSimulateLog,
    terminalLinesRef: input.deckRuntime.terminalLinesRef,
    onTerminalScroll: input.deckRuntime.onTerminalScroll,
    liveLines: input.deckRuntime.liveLines,
    streamAdapterLabel: input.deckRuntime.streamAdapterLabel,
    selectedAnomalyId: input.deckRuntime.selectedAnomalyId,
    onSelectAnomalyLine: input.deckRuntime.focusAnomaly,
    registerLineRef: input.deckRuntime.registerLineRef,
    monitorTrackTitle: screenViewModel.monitorTrackTitle,
    musicStyleLabel: input.deckRuntime.activeTrack?.tags?.musicStyleLabel,
    deckPresetLabel: input.deckRuntime.deckPresetLabel,
    deckBpm: input.deckRuntime.deckBpm,
    trackElapsedSeconds: input.deckRuntime.trackElapsedSeconds,
    deckRemainingSeconds: screenViewModel.deckRemainingSeconds,
    selectedDeckMarker: input.deckRuntime.selectedDeckMarker,
    selectedBurstCount: input.deckRuntime.selectedBurstRegion?.count ?? null,
    overviewCanvasRef: input.deckRuntime.overviewCanvasRef,
    waveformCanvasRef: input.deckRuntime.waveformCanvasRef,
    waveformStageRef: input.deckRuntime.waveformStageRef,
    anomalyBurstRegions: input.deckRuntime.anomalyBurstRegions,
    selectedBurstRegionId: input.deckRuntime.selectedBurstRegion?.id ?? null,
    overviewAnomalyMarkers: input.deckRuntime.overviewAnomalyMarkers,
    overviewWindowLeftPercent: input.deckRuntime.overviewWindowLeftPercent,
    overviewWindowWidthPercent: input.deckRuntime.overviewWindowWidthPercent,
    overviewPlayheadLeftPercent: input.deckRuntime.overviewPlayheadLeftPercent,
    onOverviewPointerDown: input.deckRuntime.handleOverviewPointerDown,
    onOverviewClick: input.deckRuntime.handleOverviewClick,
    onOverviewAnomalyClick: input.deckRuntime.handleOverviewAnomalyClick,
    onOverviewAnomalyPointerDown: input.deckRuntime.handleOverviewAnomalyPointerDown,
    deckTimelineMarkers: input.deckRuntime.deckTimelineMarkers,
    deckBeatMarkers: input.deckRuntime.deckBeatMarkers,
    onStagePointerDown: input.deckRuntime.handleStagePointerDown,
    onStageClick: input.deckRuntime.handleStageClick,
    stageHeightPx: 190 * input.deckRuntime.waveformScale,
    audioStatus: input.audioStatus,
    onResumeAudio: input.onResumeAudio,
    sourceFilter: input.launchState.sourceFilter,
    onSourceFilterChange: input.launchState.setSourceFilter,
    filteredMonitorSourceOptions: input.launchState.filteredMonitorSourceOptions,
    selectedSourceId: input.launchState.selectedSourceId,
    onSelectSourceId: input.launchState.setSelectedSourceId,
    sourceEmptyMessage: input.launchState.sourceEmptyMessage,
    tracks: input.collections.safeTracks,
    selectedSoundId: input.launchState.selectedSoundId,
    onSelectSoundId: input.launchState.setSelectedSoundId,
    getTrackTitle: getSimpleMonitorTrackTitle,
    previewTrackId: input.deckRuntime.previewTrackId,
    onToggleTrackPreview: input.deckRuntime.toggleTrackPreview,
    canStartSelectedSource: input.launchState.canStartSelectedSource,
    startHint: input.launchState.startHint,
    isLaunchingMonitor: input.launchState.isLaunchingMonitor,
    onStartMonitoringRequest: input.launchState.handleStartMonitoringRequest,
    sessions: input.collections.safePastSessions,
    onReplaySession: input.onReplaySession,
  };
}
