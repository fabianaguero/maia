import type { AppTranslations } from "../../i18n/en";
import { buildActiveMonitorDeckViewModel } from "./activeMonitorDeckViewModel";
import { buildMonitorFooterViewModel } from "./monitorFooterViewModel";
import type { LiveTailPanelProps } from "./LiveTailPanel";
import type { MonitorActiveDeckSectionProps } from "./MonitorActiveDeckSection";
import type { MonitorActiveFooterProps } from "./MonitorActiveFooter";
import type { MonitorActiveHeaderProps } from "./MonitorActiveHeader";
import type { SimpleMonitorActiveViewProps } from "./SimpleMonitorActiveView";

export interface SimpleMonitorActiveViewSections {
  headerProps: MonitorActiveHeaderProps;
  deckSectionProps: MonitorActiveDeckSectionProps;
  liveTailProps: LiveTailPanelProps;
  footerProps: MonitorActiveFooterProps;
}

export function buildSimpleMonitorActiveViewSections(input: {
  t: AppTranslations;
  props: SimpleMonitorActiveViewProps;
}): SimpleMonitorActiveViewSections {
  const { t, props } = input;
  const deckViewModel = buildActiveMonitorDeckViewModel({
    t,
    isConnectingMonitor: props.isConnectingMonitor,
    totalAnomalies: props.totalAnomalies,
    uptimeLabel: props.uptimeLabel,
    streamAdapterLabel: props.streamAdapterLabel,
    liveLineCount: props.liveLines.length,
    audioStatus: props.audioStatus,
    monitorTrackTitle: props.monitorTrackTitle,
    musicStyleLabel: props.musicStyleLabel,
    deckPresetLabel: props.deckPresetLabel,
    deckBpm: props.deckBpm,
    trackElapsedSeconds: props.trackElapsedSeconds,
    deckRemainingSeconds: props.deckRemainingSeconds,
    selectedDeckMarker: props.selectedDeckMarker,
    selectedBurstCount: props.selectedBurstCount,
  });
  const footerViewModel = buildMonitorFooterViewModel({
    t,
    streamStatusLabel: deckViewModel.streamStatusLabel,
    audioStatusLabel: deckViewModel.audioStatusLabel,
    audioStatusTone: deckViewModel.audioStatusTone,
    audioStatus: props.audioStatus,
  });
  const audioAction = footerViewModel.actions.find((action) => action.key === "audio");

  return {
    headerProps: {
      monitorSourceTitle: props.monitorSourceTitle,
      monitorSourcePath: props.monitorSourcePath,
      statusLabel: deckViewModel.headerStatusLabel,
      statusTone: deckViewModel.headerStatusTone,
      isAnomalyFilterActive: props.isAnomalyFilterActive,
      metrics: deckViewModel.headerMetrics,
      onToggleAnomalyFilter: props.onToggleAnomalyFilter,
      onStop: props.onStop,
    },
    deckSectionProps: {
      monitorSourcePath: props.monitorSourcePath,
      deckTrackLine: deckViewModel.deckTrackLine,
      legendItems: deckViewModel.legendItems,
      metaChips: deckViewModel.metaChips,
      focusBadgeLabel: deckViewModel.focusBadgeLabel,
      focusBadgeTone: deckViewModel.focusBadgeTone,
      focusTimestamp: deckViewModel.focusTimestamp,
      focusMessage: deckViewModel.focusMessage,
      focusCueCode: deckViewModel.focusCueCode,
      focusBurstLabel: deckViewModel.focusBurstLabel,
      overviewCanvasRef: props.overviewCanvasRef,
      waveformCanvasRef: props.waveformCanvasRef,
      waveformStageRef: props.waveformStageRef,
      anomalyBurstRegions: props.anomalyBurstRegions,
      selectedBurstRegionId: props.selectedBurstRegionId,
      overviewAnomalyMarkers: props.overviewAnomalyMarkers,
      selectedAnomalyId: props.selectedAnomalyId,
      overviewWindowLeftPercent: props.overviewWindowLeftPercent,
      overviewWindowWidthPercent: props.overviewWindowWidthPercent,
      overviewPlayheadLeftPercent: props.overviewPlayheadLeftPercent,
      onOverviewPointerDown: props.onOverviewPointerDown,
      onOverviewClick: props.onOverviewClick,
      onOverviewAnomalyClick: props.onOverviewAnomalyClick,
      onOverviewAnomalyPointerDown: props.onOverviewAnomalyPointerDown,
      deckTimelineMarkers: props.deckTimelineMarkers,
      deckBeatMarkers: props.deckBeatMarkers,
      onStagePointerDown: props.onStagePointerDown,
      onStageClick: props.onStageClick,
      stageHeightPx: props.stageHeightPx,
    },
    liveTailProps: {
      isConsoleExpanded: props.isConsoleExpanded,
      onToggleConsole: props.onToggleConsole,
      isAnomalyFilterActive: props.isAnomalyFilterActive,
      onClearAnomalyFilter: props.onClearAnomalyFilter,
      onRefresh: props.onRefresh,
      onSimulateLog: props.onSimulateLog,
      terminalLinesRef: props.terminalLinesRef,
      onTerminalScroll: props.onTerminalScroll,
      liveLines: props.liveLines,
      isConnectingMonitor: props.isConnectingMonitor,
      monitorSourcePath: props.monitorSourcePath,
      streamAdapterLabel: props.streamAdapterLabel,
      selectedAnomalyId: props.selectedAnomalyId,
      onSelectAnomalyLine: props.onSelectAnomalyLine,
      registerLineRef: props.registerLineRef,
    },
    footerProps: {
      statusPills: footerViewModel.statusPills,
      audioStatus: props.audioStatus,
      audioActionLabel: audioAction?.label,
      onResumeAudio: props.onResumeAudio,
    },
  };
}
