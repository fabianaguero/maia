import type { RefObject, MouseEvent, PointerEvent, UIEvent } from "react";

import type { LibraryTrack } from "../../types/library";
import type { PersistedSession } from "../../api/sessions";
import type { MonitorSourceFilter, MonitorLaunchSource } from "./monitorSourceOptions";
import type { MonitorLogLine } from "./monitorLogParsing";
import { sortMonitorSessions } from "./monitorSessions";
import type {
  AnomalyBurstRegion,
  DeckSelectedMarker,
  OverviewAnomalyMarker,
  buildDeckBeatMarkers,
  buildDeckTimelineMarkers,
} from "./monitorDeckViewModel";
import type { SimpleMonitorActiveViewProps } from "./SimpleMonitorActiveView";
import type { SimpleMonitorIdleViewProps } from "./SimpleMonitorIdleView";

export function createToggleAnomalyFilterHandler(options: {
  toggleAnomalyFilter: (updater: (value: boolean) => boolean) => void;
  isConsoleExpanded: boolean;
  onToggleConsole?: (() => void) | undefined;
}): () => void {
  return () => {
    options.toggleAnomalyFilter((value) => !value);
    if (!options.isConsoleExpanded) {
      options.onToggleConsole?.();
    }
  };
}

export function createClearAnomalyFilterHandler(
  setAnomalyFilterActive: (value: boolean) => void,
): () => void {
  return () => setAnomalyFilterActive(false);
}

export interface BuildSimpleMonitorActiveViewPropsArgs {
  isConnectingMonitor: boolean;
  monitorSourceTitle: string;
  monitorSourcePath: string;
  isAnomalyFilterActive: boolean;
  onToggleAnomalyFilter: () => void;
  onClearAnomalyFilter: () => void;
  totalAnomalies: number;
  uptimeLabel: string;
  onStop: () => void;
  isConsoleExpanded: boolean;
  onToggleConsole?: (() => void) | undefined;
  onRefresh: () => void;
  onSimulateLog: () => void;
  terminalLinesRef: RefObject<HTMLDivElement | null>;
  onTerminalScroll: (event: UIEvent<HTMLDivElement>) => void;
  liveLines: MonitorLogLine[];
  streamAdapterLabel: string;
  selectedAnomalyId: string | null;
  onSelectAnomalyLine: (anomalyId: string) => void;
  registerLineRef: (lineId: string, node: HTMLDivElement | null) => void;
  monitorTrackTitle: string;
  musicStyleLabel?: string | null;
  deckPresetLabel?: string | null;
  deckBpm: number | null;
  trackElapsedSeconds: number;
  deckRemainingSeconds: number | null;
  selectedDeckMarker: DeckSelectedMarker | null;
  selectedBurstCount: number | null;
  overviewCanvasRef: RefObject<HTMLCanvasElement | null>;
  waveformCanvasRef: RefObject<HTMLCanvasElement | null>;
  waveformStageRef: RefObject<HTMLDivElement | null>;
  anomalyBurstRegions: AnomalyBurstRegion[];
  selectedBurstRegionId: string | null;
  overviewAnomalyMarkers: OverviewAnomalyMarker[];
  overviewWindowLeftPercent: number;
  overviewWindowWidthPercent: number;
  overviewPlayheadLeftPercent: number;
  onOverviewPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onOverviewClick: (event: MouseEvent<HTMLDivElement>) => void;
  onOverviewAnomalyClick: SimpleMonitorActiveViewProps["onOverviewAnomalyClick"];
  onOverviewAnomalyPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  deckTimelineMarkers: ReturnType<typeof buildDeckTimelineMarkers>;
  deckBeatMarkers: ReturnType<typeof buildDeckBeatMarkers>;
  onStagePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onStageClick: (event: MouseEvent<HTMLDivElement>) => void;
  stageHeightPx: number;
  audioStatus: AudioContextState;
  onResumeAudio: () => Promise<void> | void;
}

export function buildSimpleMonitorActiveViewProps(
  args: BuildSimpleMonitorActiveViewPropsArgs,
): SimpleMonitorActiveViewProps {
  return {
    isConnectingMonitor: args.isConnectingMonitor,
    monitorSourceTitle: args.monitorSourceTitle,
    monitorSourcePath: args.monitorSourcePath,
    isAnomalyFilterActive: args.isAnomalyFilterActive,
    onToggleAnomalyFilter: args.onToggleAnomalyFilter,
    onClearAnomalyFilter: args.onClearAnomalyFilter,
    totalAnomalies: args.totalAnomalies,
    uptimeLabel: args.uptimeLabel,
    onStop: args.onStop,
    isConsoleExpanded: args.isConsoleExpanded,
    onToggleConsole: args.onToggleConsole,
    onRefresh: args.onRefresh,
    onSimulateLog: args.onSimulateLog,
    terminalLinesRef: args.terminalLinesRef,
    onTerminalScroll: args.onTerminalScroll,
    liveLines: args.liveLines,
    streamAdapterLabel: args.streamAdapterLabel,
    selectedAnomalyId: args.selectedAnomalyId,
    onSelectAnomalyLine: args.onSelectAnomalyLine,
    registerLineRef: args.registerLineRef,
    monitorTrackTitle: args.monitorTrackTitle,
    musicStyleLabel: args.musicStyleLabel,
    deckPresetLabel: args.deckPresetLabel,
    deckBpm: args.deckBpm,
    trackElapsedSeconds: args.trackElapsedSeconds,
    deckRemainingSeconds: args.deckRemainingSeconds,
    selectedDeckMarker: args.selectedDeckMarker,
    selectedBurstCount: args.selectedBurstCount,
    overviewCanvasRef: args.overviewCanvasRef,
    waveformCanvasRef: args.waveformCanvasRef,
    waveformStageRef: args.waveformStageRef,
    anomalyBurstRegions: args.anomalyBurstRegions,
    selectedBurstRegionId: args.selectedBurstRegionId,
    overviewAnomalyMarkers: args.overviewAnomalyMarkers,
    overviewWindowLeftPercent: args.overviewWindowLeftPercent,
    overviewWindowWidthPercent: args.overviewWindowWidthPercent,
    overviewPlayheadLeftPercent: args.overviewPlayheadLeftPercent,
    onOverviewPointerDown: args.onOverviewPointerDown,
    onOverviewClick: args.onOverviewClick,
    onOverviewAnomalyClick: args.onOverviewAnomalyClick,
    onOverviewAnomalyPointerDown: args.onOverviewAnomalyPointerDown,
    deckTimelineMarkers: args.deckTimelineMarkers,
    deckBeatMarkers: args.deckBeatMarkers,
    onStagePointerDown: args.onStagePointerDown,
    onStageClick: args.onStageClick,
    stageHeightPx: args.stageHeightPx,
    audioStatus: args.audioStatus,
    onResumeAudio: args.onResumeAudio,
  };
}

export interface BuildSimpleMonitorIdleViewPropsArgs {
  sourceFilter: MonitorSourceFilter;
  onSourceFilterChange: (value: MonitorSourceFilter) => void;
  filteredMonitorSourceOptions: MonitorLaunchSource[];
  selectedSourceId: string;
  onSelectSourceId: (value: string) => void;
  sourceEmptyMessage: string;
  tracks: LibraryTrack[];
  selectedSoundId: string;
  onSelectSoundId: (value: string) => void;
  getTrackTitle: (track: LibraryTrack) => string;
  previewTrackId: string | null;
  onToggleTrackPreview: (track: LibraryTrack) => void | Promise<void>;
  canStartSelectedSource: boolean;
  startHint: string;
  isLaunchingMonitor: boolean;
  onStartMonitoringRequest: () => void | Promise<void>;
  sessions: PersistedSession[];
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
}

export function buildSimpleMonitorIdleViewProps(
  args: BuildSimpleMonitorIdleViewPropsArgs,
): SimpleMonitorIdleViewProps {
  return {
    sourceFilter: args.sourceFilter,
    onSourceFilterChange: args.onSourceFilterChange,
    filteredMonitorSourceOptions: args.filteredMonitorSourceOptions,
    selectedSourceId: args.selectedSourceId,
    onSelectSourceId: args.onSelectSourceId,
    sourceEmptyMessage: args.sourceEmptyMessage,
    tracks: args.tracks,
    selectedSoundId: args.selectedSoundId,
    onSelectSoundId: args.onSelectSoundId,
    getTrackTitle: args.getTrackTitle,
    previewTrackId: args.previewTrackId,
    onToggleTrackPreview: args.onToggleTrackPreview,
    canStartSelectedSource: args.canStartSelectedSource,
    startHint: args.startHint,
    isLaunchingMonitor: args.isLaunchingMonitor,
    onStartMonitoringRequest: args.onStartMonitoringRequest,
    sessions: args.sessions,
    onReplaySession: args.onReplaySession,
  };
}

interface BuildSimpleMonitorScreenStateViewModelArgs {
  isMonitorActive: boolean;
  activeViewArgs: BuildSimpleMonitorActiveViewPropsArgs;
  idleViewArgs: BuildSimpleMonitorIdleViewPropsArgs;
}

export interface BuildSimpleMonitorScreenSectionsArgs {
  isConnectingMonitor: boolean;
  monitorSourceTitle: string;
  monitorSourcePath: string;
  isAnomalyFilterActive: boolean;
  onToggleAnomalyFilter: () => void;
  onClearAnomalyFilter: () => void;
  totalAnomalies: number;
  uptimeLabel: string;
  onStop: () => void;
  isConsoleExpanded: boolean;
  onToggleConsole?: (() => void) | undefined;
  onRefresh: () => void;
  onSimulateLog: () => void;
  terminalLinesRef: RefObject<HTMLDivElement | null>;
  onTerminalScroll: (event: UIEvent<HTMLDivElement>) => void;
  liveLines: MonitorLogLine[];
  streamAdapterLabel: string;
  selectedAnomalyId: string | null;
  onSelectAnomalyLine: (anomalyId: string) => void;
  registerLineRef: (lineId: string, node: HTMLDivElement | null) => void;
  monitorTrackTitle: string;
  musicStyleLabel?: string | null;
  deckPresetLabel?: string | null;
  deckBpm: number | null;
  trackElapsedSeconds: number;
  deckRemainingSeconds: number | null;
  selectedDeckMarker: DeckSelectedMarker | null;
  selectedBurstCount: number | null;
  overviewCanvasRef: RefObject<HTMLCanvasElement | null>;
  waveformCanvasRef: RefObject<HTMLCanvasElement | null>;
  waveformStageRef: RefObject<HTMLDivElement | null>;
  anomalyBurstRegions: AnomalyBurstRegion[];
  selectedBurstRegionId: string | null;
  overviewAnomalyMarkers: OverviewAnomalyMarker[];
  overviewWindowLeftPercent: number;
  overviewWindowWidthPercent: number;
  overviewPlayheadLeftPercent: number;
  onOverviewPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onOverviewClick: (event: MouseEvent<HTMLDivElement>) => void;
  onOverviewAnomalyClick: SimpleMonitorActiveViewProps["onOverviewAnomalyClick"];
  onOverviewAnomalyPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  deckTimelineMarkers: ReturnType<typeof buildDeckTimelineMarkers>;
  deckBeatMarkers: ReturnType<typeof buildDeckBeatMarkers>;
  onStagePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onStageClick: (event: MouseEvent<HTMLDivElement>) => void;
  stageHeightPx: number;
  audioStatus: AudioContextState;
  onResumeAudio: () => Promise<void> | void;
  sourceFilter: MonitorSourceFilter;
  onSourceFilterChange: (value: MonitorSourceFilter) => void;
  filteredMonitorSourceOptions: MonitorLaunchSource[];
  selectedSourceId: string;
  onSelectSourceId: (value: string) => void;
  sourceEmptyMessage: string;
  tracks: LibraryTrack[];
  selectedSoundId: string;
  onSelectSoundId: (value: string) => void;
  getTrackTitle: (track: LibraryTrack) => string;
  previewTrackId: string | null;
  onToggleTrackPreview: (track: LibraryTrack) => void | Promise<void>;
  canStartSelectedSource: boolean;
  startHint: string;
  isLaunchingMonitor: boolean;
  onStartMonitoringRequest: () => void | Promise<void>;
  sessions: PersistedSession[];
  onReplaySession: (sessionId: string, sourcePath: string, repoTitle: string) => void;
}

export function buildSimpleMonitorScreenSections(
  args: BuildSimpleMonitorScreenSectionsArgs,
): {
  activeViewArgs: BuildSimpleMonitorActiveViewPropsArgs;
  idleViewArgs: BuildSimpleMonitorIdleViewPropsArgs;
} {
  return {
    activeViewArgs: {
      isConnectingMonitor: args.isConnectingMonitor,
      monitorSourceTitle: args.monitorSourceTitle,
      monitorSourcePath: args.monitorSourcePath,
      isAnomalyFilterActive: args.isAnomalyFilterActive,
      onToggleAnomalyFilter: args.onToggleAnomalyFilter,
      onClearAnomalyFilter: args.onClearAnomalyFilter,
      totalAnomalies: args.totalAnomalies,
      uptimeLabel: args.uptimeLabel,
      onStop: args.onStop,
      isConsoleExpanded: args.isConsoleExpanded,
      onToggleConsole: args.onToggleConsole,
      onRefresh: args.onRefresh,
      onSimulateLog: args.onSimulateLog,
      terminalLinesRef: args.terminalLinesRef,
      onTerminalScroll: args.onTerminalScroll,
      liveLines: args.liveLines,
      streamAdapterLabel: args.streamAdapterLabel,
      selectedAnomalyId: args.selectedAnomalyId,
      onSelectAnomalyLine: args.onSelectAnomalyLine,
      registerLineRef: args.registerLineRef,
      monitorTrackTitle: args.monitorTrackTitle,
      musicStyleLabel: args.musicStyleLabel,
      deckPresetLabel: args.deckPresetLabel,
      deckBpm: args.deckBpm,
      trackElapsedSeconds: args.trackElapsedSeconds,
      deckRemainingSeconds: args.deckRemainingSeconds,
      selectedDeckMarker: args.selectedDeckMarker,
      selectedBurstCount: args.selectedBurstCount,
      overviewCanvasRef: args.overviewCanvasRef,
      waveformCanvasRef: args.waveformCanvasRef,
      waveformStageRef: args.waveformStageRef,
      anomalyBurstRegions: args.anomalyBurstRegions,
      selectedBurstRegionId: args.selectedBurstRegionId,
      overviewAnomalyMarkers: args.overviewAnomalyMarkers,
      overviewWindowLeftPercent: args.overviewWindowLeftPercent,
      overviewWindowWidthPercent: args.overviewWindowWidthPercent,
      overviewPlayheadLeftPercent: args.overviewPlayheadLeftPercent,
      onOverviewPointerDown: args.onOverviewPointerDown,
      onOverviewClick: args.onOverviewClick,
      onOverviewAnomalyClick: args.onOverviewAnomalyClick,
      onOverviewAnomalyPointerDown: args.onOverviewAnomalyPointerDown,
      deckTimelineMarkers: args.deckTimelineMarkers,
      deckBeatMarkers: args.deckBeatMarkers,
      onStagePointerDown: args.onStagePointerDown,
      onStageClick: args.onStageClick,
      stageHeightPx: args.stageHeightPx,
      audioStatus: args.audioStatus,
      onResumeAudio: args.onResumeAudio,
    },
    idleViewArgs: {
      sourceFilter: args.sourceFilter,
      onSourceFilterChange: args.onSourceFilterChange,
      filteredMonitorSourceOptions: args.filteredMonitorSourceOptions,
      selectedSourceId: args.selectedSourceId,
      onSelectSourceId: args.onSelectSourceId,
      sourceEmptyMessage: args.sourceEmptyMessage,
      tracks: args.tracks,
      selectedSoundId: args.selectedSoundId,
      onSelectSoundId: args.onSelectSoundId,
      getTrackTitle: args.getTrackTitle,
      previewTrackId: args.previewTrackId,
      onToggleTrackPreview: args.onToggleTrackPreview,
      canStartSelectedSource: args.canStartSelectedSource,
      startHint: args.startHint,
      isLaunchingMonitor: args.isLaunchingMonitor,
      onStartMonitoringRequest: args.onStartMonitoringRequest,
      sessions: args.sessions,
      onReplaySession: args.onReplaySession,
    },
  };
}

export function buildSimpleMonitorScreenStateViewModel(
  args: BuildSimpleMonitorScreenStateViewModelArgs,
): {
  isMonitorActive: boolean;
  activeViewProps: SimpleMonitorActiveViewProps;
  idleViewProps: SimpleMonitorIdleViewProps;
} {
  return {
    isMonitorActive: args.isMonitorActive,
    activeViewProps: buildSimpleMonitorActiveViewProps(args.activeViewArgs),
    idleViewProps: buildSimpleMonitorIdleViewProps(args.idleViewArgs),
  };
}

export interface BuildSimpleMonitorScreenHookStateArgs
  extends Omit<BuildSimpleMonitorScreenSectionsArgs, "sessions"> {
  isMonitorActive: boolean;
  sessions: PersistedSession[];
}

export function buildSimpleMonitorScreenHookState(args: BuildSimpleMonitorScreenHookStateArgs): {
  isMonitorActive: boolean;
  activeViewProps: SimpleMonitorActiveViewProps;
  idleViewProps: SimpleMonitorIdleViewProps;
} {
  const sections = buildSimpleMonitorScreenSections({
    ...args,
    sessions: sortMonitorSessions(args.sessions),
  });

  return buildSimpleMonitorScreenStateViewModel({
    isMonitorActive: args.isMonitorActive,
    activeViewArgs: sections.activeViewArgs,
    idleViewArgs: sections.idleViewArgs,
  });
}
