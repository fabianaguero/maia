import { useState } from "react";

import type {
  ActiveMonitorSession,
  MonitorMetrics,
} from "../monitor/monitorContextTypes";
import type { PersistedSession } from "../../api/sessions";
import { useT } from "../../i18n/I18nContext";
import type { LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorLaunchSource } from "./monitorSourceOptions";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import { buildSimpleMonitorCollectionsState } from "./simpleMonitorScreenStateRuntime";
import {
  buildSimpleMonitorDeckRuntimeInput,
  buildSimpleMonitorLaunchStateInput,
  buildSimpleMonitorScreenHookArgsInput,
} from "./simpleMonitorScreenOrchestrationRuntime";
import {
  buildSimpleMonitorScreenHookState,
  createClearAnomalyFilterHandler,
  createToggleAnomalyFilterHandler,
} from "./simpleMonitorScreenRuntime";
import { useSimpleMonitorDeckRuntime } from "./useSimpleMonitorDeckRuntime";
import { useSimpleMonitorLaunchState } from "./useSimpleMonitorLaunchState";

export interface SimpleMonitorScreenStateInput {
  session: ActiveMonitorSession | null;
  metrics: MonitorMetrics;
  pastSessions: PersistedSession[];
  repositories: RepositoryAnalysis[];
  tracks: LibraryTrack[];
  onStop: () => void;
  onResumeAudio: () => Promise<void> | void;
  audioStatus: AudioContextState;
  audioContext: AudioContext | null;
  onStartMonitoring: (source: MonitorLaunchSource, trackId?: string) => void | Promise<void>;
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  trackName?: string;
  waveformBins?: number[];
  isConsoleExpanded?: boolean;
  onToggleConsole?: () => void;
  liveSettings: MonitorSetupPreferences;
}

export function useSimpleMonitorScreenState({
  session,
  metrics,
  pastSessions,
  repositories,
  tracks,
  onStop,
  onResumeAudio,
  audioStatus,
  audioContext,
  onStartMonitoring,
  onReplaySession,
  subscribe,
  trackName,
  waveformBins,
  isConsoleExpanded = false,
  onToggleConsole,
  liveSettings,
}: SimpleMonitorScreenStateInput) {
  const t = useT();
  const isListening = !!session;
  const { safePastSessions, safeRepositories, safeTracks } = buildSimpleMonitorCollectionsState({
    pastSessions,
    repositories,
    tracks,
  });
  const [isAnomalyFilterActive, setIsAnomalyFilterActive] = useState(false);
  const launchStateInput = buildSimpleMonitorLaunchStateInput({
    repositories: safeRepositories,
    isListening,
    t,
    onResumeAudio,
    onStartMonitoring,
  });
  const {
    selectedSoundId,
    setSelectedSoundId,
    filteredMonitorSourceOptions,
    selectedSourceOption,
    canStartSelectedSource,
    sourceEmptyMessage,
    startHint,
    selectedSourceId,
    setSelectedSourceId,
    sourceFilter,
    setSourceFilter,
    isLaunchingMonitor,
    handleStartMonitoringRequest,
  } = useSimpleMonitorLaunchState(launchStateInput);
  const launchingSource = selectedSourceOption;
  const deckRuntimeInput = buildSimpleMonitorDeckRuntimeInput({
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
  const {
    activeTrack,
    previewTrackId,
    toggleTrackPreview,
    deckPresetLabel,
    streamAdapterLabel,
    isMonitorActive,
    liveLines,
    selectedAnomalyId,
    simulateLog,
    terminalLinesRef,
    onTerminalScroll,
    registerLineRef,
    focusAnomaly,
    deckBpm,
    trackElapsedSeconds,
    deckDurationSeconds,
    overviewCanvasRef,
    waveformCanvasRef,
    waveformStageRef,
    anomalyBurstRegions,
    selectedBurstRegion,
    overviewAnomalyMarkers,
    overviewWindowLeftPercent,
    overviewWindowWidthPercent,
    overviewPlayheadLeftPercent,
    handleOverviewPointerDown,
    handleOverviewClick,
    handleOverviewAnomalyClick,
    handleOverviewAnomalyPointerDown,
    selectedDeckMarker,
    deckTimelineMarkers,
    deckBeatMarkers,
    handleStagePointerDown,
    handleStageClick,
    waveformScale,
  } = useSimpleMonitorDeckRuntime(deckRuntimeInput);
  const handleToggleAnomalyFilter = createToggleAnomalyFilterHandler({
    toggleAnomalyFilter: (updater) => setIsAnomalyFilterActive(updater),
    isConsoleExpanded,
    onToggleConsole,
  });
  const handleClearAnomalyFilter = createClearAnomalyFilterHandler(setIsAnomalyFilterActive);
  const hookStateArgs = buildSimpleMonitorScreenHookArgsInput({
    session,
    metrics,
    t,
    nowMs: Date.now(),
    trackName,
    isConsoleExpanded,
    onToggleConsole,
    onStop,
    onRefresh: () => window.location.reload(),
    onSimulateLog: simulateLog,
    onResumeAudio,
    onReplaySession,
    isAnomalyFilterActive,
    onToggleAnomalyFilter: handleToggleAnomalyFilter,
    onClearAnomalyFilter: handleClearAnomalyFilter,
    launchState: {
      selectedSoundId,
      setSelectedSoundId,
      filteredMonitorSourceOptions,
      selectedSourceOption: launchingSource,
      canStartSelectedSource,
      sourceEmptyMessage,
      startHint,
      selectedSourceId,
      setSelectedSourceId,
      sourceFilter,
      setSourceFilter,
      isLaunchingMonitor,
      handleStartMonitoringRequest,
    },
    deckRuntime: {
      activeTrack,
      previewTrackId,
      toggleTrackPreview,
      deckPresetLabel,
      streamAdapterLabel,
      isMonitorActive,
      liveLines,
      selectedAnomalyId,
      simulateLog,
      terminalLinesRef,
      onTerminalScroll,
      registerLineRef,
      focusAnomaly,
      deckBpm,
      trackElapsedSeconds,
      deckDurationSeconds,
      overviewCanvasRef,
      waveformCanvasRef,
      waveformStageRef,
      anomalyBurstRegions,
      selectedBurstRegion,
      overviewAnomalyMarkers,
      overviewWindowLeftPercent,
      overviewWindowWidthPercent,
      overviewPlayheadLeftPercent,
      handleOverviewPointerDown,
      handleOverviewClick,
      handleOverviewAnomalyClick,
      handleOverviewAnomalyPointerDown,
      selectedDeckMarker,
      deckTimelineMarkers,
      deckBeatMarkers,
      handleStagePointerDown,
      handleStageClick,
      waveformScale,
    },
    collections: {
      safePastSessions,
      safeRepositories,
      safeTracks,
    },
    audioStatus,
  });

  return buildSimpleMonitorScreenHookState(hookStateArgs);
}
