import type { MouseEvent, PointerEvent, UIEvent } from "react";

import type { AppTranslations } from "../../i18n/en";
import type { ActiveMonitorSession } from "../monitor/monitorContextTypes";
import type { BeatGridPoint, LibraryTrack } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorAlertShape, MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import type {
  AnomalyBurstRegion,
  DeckSelectedMarker,
  OverviewAnomalyMarker,
  WaveformAnomalyMarker,
  buildDeckBeatMarkers,
  buildDeckTimelineMarkers,
} from "./monitorDeckViewModel";
import type { MonitorLogLine } from "./monitorLogParsing";
import {
  buildSimpleMonitorDeckStateViewModel,
  resolveSimpleMonitorActiveTrack,
  type SimpleMonitorDeckPreset,
  type SimpleMonitorVisualPreset,
} from "./simpleMonitorViewModel";

export function resolveSimpleMonitorDeckBpm(
  liveSuggestedBpm: number | null,
  activeTrack: LibraryTrack | null,
): number | null {
  return liveSuggestedBpm ?? activeTrack?.analysis?.bpm ?? null;
}

export interface BuildSimpleMonitorDeckRuntimeStateArgs {
  session: ActiveMonitorSession | null;
  isListening: boolean;
  isLaunchingMonitor: boolean;
  tracks: LibraryTrack[];
  trackName?: string;
  trackDurationSeconds: number | null;
  activePreset: SimpleMonitorDeckPreset;
  alertShape: MonitorAlertShape;
  liveSuggestedBpm: number | null;
  t: AppTranslations;
}

export interface SimpleMonitorDeckRuntimeState {
  activeTrack: LibraryTrack | null;
  deckDurationSeconds: number | null;
  activeBeatGrid: BeatGridPoint[] | null;
  streamAdapterLabel: string;
  isMonitorActive: boolean;
  deckPresetLabel: string;
  deckVisualPreset: SimpleMonitorVisualPreset;
  deckBpm: number | null;
}

export function buildSimpleMonitorDeckRuntimeState(
  input: BuildSimpleMonitorDeckRuntimeStateArgs,
): SimpleMonitorDeckRuntimeState {
  const activeTrack = resolveSimpleMonitorActiveTrack(
    input.tracks,
    undefined,
    input.trackName,
    input.session?.trackId,
    input.session?.trackName,
  );
  const deckState = buildSimpleMonitorDeckStateViewModel({
    session: input.session,
    isListening: input.isListening,
    isLaunchingMonitor: input.isLaunchingMonitor,
    activeTrack,
    trackDurationSeconds: input.trackDurationSeconds,
    activePreset: input.activePreset,
    alertShape: input.alertShape,
    t: input.t,
  });

  return {
    activeTrack,
    deckDurationSeconds: deckState.deckDurationSeconds,
    activeBeatGrid: deckState.activeBeatGrid,
    streamAdapterLabel: deckState.streamAdapterLabel,
    isMonitorActive: deckState.isMonitorActive,
    deckPresetLabel: deckState.deckPresetLabel,
    deckVisualPreset: deckState.deckVisualPreset,
    deckBpm: resolveSimpleMonitorDeckBpm(input.liveSuggestedBpm, activeTrack),
  };
}

export interface BuildMonitorTrackAudioHookInputArgs {
  audioContext: AudioContext | null;
  isListening: boolean;
  safeRuntime: boolean;
  activeTrack: LibraryTrack | null;
  ensureBackgroundGraph: (audio: HTMLAudioElement, context: AudioContext) => unknown;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  setTrackDurationSeconds: (value: number | null) => void;
}

export function buildMonitorTrackAudioHookInput(input: BuildMonitorTrackAudioHookInputArgs) {
  return {
    audioContext: input.audioContext,
    isListening: input.isListening,
    safeRuntime: input.safeRuntime,
    activeTrack: input.activeTrack,
    ensureBackgroundGraph: input.ensureBackgroundGraph,
    setTrackWaveProgress: input.setTrackWaveProgress,
    setTrackElapsedSeconds: input.setTrackElapsedSeconds,
    setTrackDurationSeconds: input.setTrackDurationSeconds,
  };
}

export interface BuildMonitorLiveStreamHookInputArgs {
  isListening: boolean;
  sessionSourcePath?: string;
  streamAdapterLabel: string;
  subscribe: (listener: (update: LiveLogStreamUpdate) => void) => () => void;
  audioContextRef: { current: AudioContext | null };
  backgroundAudioRef: { current: HTMLAudioElement | null };
  backgroundGraphRef: { current: unknown };
  activeTrackRef: { current: LibraryTrack | null };
  deckDurationSecondsRef: { current: number | null };
  trackWaveProgressRef: { current: number };
  deckControlsRef: { current: MonitorDeckControls };
  trackBpm: number | null;
  ensureBackgroundGraph: (audio: HTMLAudioElement, context: AudioContext) => unknown;
  applyTrackMutation: (update: LiveLogStreamUpdate) => void;
  playTestTone: () => void;
  playCueBatch: (
    cues: Array<{
      noteHz?: number;
      gain?: number;
      durationMs?: number;
      waveform?: OscillatorType;
      accent?: string;
    }>,
  ) => void;
  liveSettings: MonitorSetupPreferences;
}

export function buildMonitorLiveStreamHookInput(input: BuildMonitorLiveStreamHookInputArgs) {
  return {
    isListening: input.isListening,
    sessionSourcePath: input.sessionSourcePath,
    streamAdapterLabel: input.streamAdapterLabel,
    subscribe: input.subscribe,
    audioContextRef: input.audioContextRef,
    backgroundAudioRef: input.backgroundAudioRef,
    backgroundGraphRef: input.backgroundGraphRef,
    activeTrackRef: input.activeTrackRef,
    deckDurationSecondsRef: input.deckDurationSecondsRef,
    trackWaveProgressRef: input.trackWaveProgressRef,
    deckControlsRef: input.deckControlsRef,
    trackBpm: input.trackBpm,
    ensureBackgroundGraph: input.ensureBackgroundGraph,
    applyTrackMutation: input.applyTrackMutation,
    playTestTone: input.playTestTone,
    playCueBatch: input.playCueBatch,
    idleHoldMs: input.liveSettings.idleHoldMs,
    maxLiveLines: input.liveSettings.tailWindowRows,
  };
}

export interface BuildMonitorDeckPresentationHookInputArgs {
  backgroundAudioRef: { current: HTMLAudioElement | null };
  waveformBins?: number[];
  waveformAnomalies: WaveformAnomalyMarker[];
  trackWaveProgress: number;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  deckDurationSeconds: number | null;
  deckBpm: number | null;
  activeBeatGrid: BeatGridPoint[] | null;
  logSignalBuffer: Array<{ val: number; heat: number }>;
  selectedAnomalyId: string | null;
  setSelectedAnomalyId: (anomalyId: string) => void;
  liveLines: Array<{ id: string; anomalyId?: string | null }>;
  isConsoleExpanded: boolean;
  onToggleConsole?: () => void;
  deckVisualPreset: "passive" | "balanced" | "alert";
  waveformScale: number;
  safeRuntime: boolean;
}

export function buildMonitorDeckPresentationHookInput(
  input: BuildMonitorDeckPresentationHookInputArgs,
) {
  return {
    backgroundAudioRef: input.backgroundAudioRef,
    waveformBins: input.waveformBins,
    waveformAnomalies: input.waveformAnomalies,
    trackWaveProgress: input.trackWaveProgress,
    setTrackWaveProgress: input.setTrackWaveProgress,
    setTrackElapsedSeconds: input.setTrackElapsedSeconds,
    deckDurationSeconds: input.deckDurationSeconds,
    deckBpm: input.deckBpm,
    activeBeatGrid: input.activeBeatGrid,
    logSignalBuffer: input.logSignalBuffer,
    selectedAnomalyId: input.selectedAnomalyId,
    setSelectedAnomalyId: input.setSelectedAnomalyId,
    liveLines: input.liveLines,
    isConsoleExpanded: input.isConsoleExpanded,
    onToggleConsole: input.onToggleConsole,
    deckVisualPreset: input.deckVisualPreset,
    waveformScale: input.waveformScale,
    safeRuntime: input.safeRuntime,
  };
}

export interface BuildSimpleMonitorDeckHookStateArgs {
  activeTrack: LibraryTrack | null;
  previewTrackId: string | null;
  toggleTrackPreview: (track: LibraryTrack) => void | Promise<void>;
  deckPresetLabel: string;
  streamAdapterLabel: string;
  isMonitorActive: boolean;
  liveLines: MonitorLogLine[];
  selectedAnomalyId: string | null;
  simulateLog: () => void;
  terminalLinesRef: { current: HTMLDivElement | null };
  onTerminalScroll: (event: UIEvent<HTMLDivElement>) => void;
  registerLineRef: (lineId: string, node: HTMLDivElement | null) => void;
  focusAnomaly: (anomalyId: string) => void;
  deckBpm: number | null;
  trackElapsedSeconds: number;
  deckDurationSeconds: number | null;
  overviewCanvasRef: { current: HTMLCanvasElement | null };
  waveformCanvasRef: { current: HTMLCanvasElement | null };
  waveformStageRef: { current: HTMLDivElement | null };
  anomalyBurstRegions: AnomalyBurstRegion[];
  selectedBurstRegion: AnomalyBurstRegion | null;
  overviewAnomalyMarkers: OverviewAnomalyMarker[];
  overviewWindowLeftPercent: number;
  overviewWindowWidthPercent: number;
  overviewPlayheadLeftPercent: number;
  handleOverviewPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  handleOverviewClick: (event: MouseEvent<HTMLDivElement>) => void;
  handleOverviewAnomalyClick: (
    marker: {
      id: string;
      progress: number;
      severity: number;
      timestamp: string;
      message: string;
      leftPercent: number;
    },
    event: MouseEvent<HTMLButtonElement>,
  ) => void;
  handleOverviewAnomalyPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  selectedDeckMarker: DeckSelectedMarker | null;
  deckTimelineMarkers: ReturnType<typeof buildDeckTimelineMarkers>;
  deckBeatMarkers: ReturnType<typeof buildDeckBeatMarkers>;
  handleStagePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  handleStageClick: (event: MouseEvent<HTMLDivElement>) => void;
  waveformScale: number;
}

export function buildSimpleMonitorDeckHookState(input: BuildSimpleMonitorDeckHookStateArgs) {
  return {
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
  };
}
