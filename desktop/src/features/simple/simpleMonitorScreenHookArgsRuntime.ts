import type { AppTranslations } from "../../i18n/types";
import { getTrackTitle as getLibraryTrackTitle } from "../../utils/track";
import type { LibraryTrack } from "../../types/library";
import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/monitorContextTypes";
import { buildSimpleMonitorScreenViewModel } from "./simpleMonitorViewModel";
import type { SimpleMonitorCollectionsState } from "./simpleMonitorScreenStateRuntime";
import type {
  SimpleMonitorDeckRuntimeSlice,
  SimpleMonitorLaunchStateSlice,
} from "./simpleMonitorScreenSlicesRuntime";

function getSimpleMonitorTrackTitle(track: LibraryTrack): string {
  return getLibraryTrackTitle(track);
}

export interface BuildSimpleMonitorHookArgsSharedInput {
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  t: AppTranslations;
  nowMs: number;
  trackName?: string;
  launchState: SimpleMonitorLaunchStateSlice;
  deckRuntime: SimpleMonitorDeckRuntimeSlice;
  collections: SimpleMonitorCollectionsState;
}

export function buildSimpleMonitorScreenMeta(input: BuildSimpleMonitorHookArgsSharedInput) {
  return buildSimpleMonitorScreenViewModel({
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
}

export function buildSimpleMonitorActiveHookArgs(input: {
  screenMeta: ReturnType<typeof buildSimpleMonitorScreenMeta>;
  metrics: MonitorMetrics;
  isMonitorActive: boolean;
  isAnomalyFilterActive: boolean;
  onToggleAnomalyFilter: () => void;
  onClearAnomalyFilter: () => void;
  onStop: () => void;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  onRefresh: () => void;
  onSimulateLog: () => void;
  onResumeAudio: () => Promise<void> | void;
  deckRuntime: SimpleMonitorDeckRuntimeSlice;
  audioStatus: AudioContextState;
}) {
  return {
    isMonitorActive: input.isMonitorActive,
    isConnectingMonitor: input.screenMeta.isConnectingMonitor,
    monitorSourceTitle: input.screenMeta.monitorSourceTitle,
    monitorSourcePath: input.screenMeta.monitorSourcePath,
    isAnomalyFilterActive: input.isAnomalyFilterActive,
    onToggleAnomalyFilter: input.onToggleAnomalyFilter,
    onClearAnomalyFilter: input.onClearAnomalyFilter,
    totalAnomalies: input.metrics.totalAnomalies,
    uptimeLabel: input.screenMeta.uptimeLabel,
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
    monitorTrackTitle: input.screenMeta.monitorTrackTitle,
    musicStyleLabel: input.deckRuntime.activeTrack?.tags?.musicStyleLabel,
    deckPresetLabel: input.deckRuntime.deckPresetLabel,
    deckBpm: input.deckRuntime.deckBpm,
    trackElapsedSeconds: input.deckRuntime.trackElapsedSeconds,
    deckRemainingSeconds: input.screenMeta.deckRemainingSeconds,
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
  };
}

export function buildSimpleMonitorIdleHookArgs(input: {
  launchState: SimpleMonitorLaunchStateSlice;
  collections: SimpleMonitorCollectionsState;
  deckRuntime: SimpleMonitorDeckRuntimeSlice;
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
}) {
  return {
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
