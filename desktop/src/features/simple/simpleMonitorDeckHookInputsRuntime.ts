import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { BeatGridPoint, LibraryTrack } from "../../types/library";
import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorCueBatchPlayer } from "./monitorCueBatchTypes";
import type { MonitorSetupPreferences } from "./monitorSetupPreferences";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { MonitorLogLine } from "./monitorLogParsing";

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
  playCueBatch: MonitorCueBatchPlayer;
  liveSettings: MonitorSetupPreferences;
}

function resolveMonitorLiveStreamRuntimeSettings(liveSettings: MonitorSetupPreferences) {
  return {
    idleHoldMs: liveSettings.idleHoldMs,
    maxLiveLines: liveSettings.tailWindowRows,
  };
}

export function buildMonitorLiveStreamHookInput(input: BuildMonitorLiveStreamHookInputArgs) {
  const runtimeSettings = resolveMonitorLiveStreamRuntimeSettings(input.liveSettings);

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
    idleHoldMs: runtimeSettings.idleHoldMs,
    maxLiveLines: runtimeSettings.maxLiveLines,
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
  liveLines: MonitorLogLine[];
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
