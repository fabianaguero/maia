import type { LiveLogCue, LiveLogMarker } from "../../types/monitor";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { LibraryTrack } from "../../types/library";
import { getBasename } from "./monitorDisplay";
import { quantizeProgressToBeatGrid, type WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { MonitorLogLine } from "./monitorLogParsing";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamSignalRuntime";
import { createMonitorSignalBuffer } from "./monitorLiveStreamSignalRuntime";

export interface SanitizedLiveLogStreamUpdate {
  parsedLines: string[];
  cueBatch: LiveLogCue[];
  anomalyMarkers: LiveLogMarker[];
  hasRealLines: boolean;
  hasRealSignals: boolean;
  hasMeaningfulUpdate: boolean;
  suggestedBpm: number | null;
}

export interface MonitorLiveStreamHookState {
  liveLines: MonitorLogLine[];
  logSignalBuffer: MonitorLogSignalPoint[];
  liveSuggestedBpm: number | null;
  waveformAnomalies: WaveformAnomalyMarker[];
  selectedAnomalyId: string | null;
  setSelectedAnomalyId: (
    value: string | null | ((current: string | null) => string | null),
  ) => void;
  simulateLog: () => void;
}

export interface MonitorWaveContextSnapshot {
  durationSeconds: number | null;
  currentProgress: number;
  bpm: number | null;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function buildMonitorBootstrapLine(input: {
  sessionSourcePath?: string;
  streamAdapterLabel: string;
  now?: Date;
}): MonitorLogLine {
  const currentDate = input.now ?? new Date();

  return {
    id: "maia-monitor-init",
    timestamp: currentDate.toLocaleTimeString().split(" ")[0],
    level: "info",
    message: `MAIA_MONITOR_INITIALIZED: ${input.streamAdapterLabel} armed. Listening to ${getBasename(input.sessionSourcePath)}...`,
    isAnomaly: false,
    anomalyId: null,
  };
}

export function buildMonitorLiveStreamResetState(): Pick<
  MonitorLiveStreamHookState,
  "liveLines" | "logSignalBuffer" | "liveSuggestedBpm" | "waveformAnomalies" | "selectedAnomalyId"
> {
  return {
    liveLines: [],
    logSignalBuffer: createMonitorSignalBuffer(),
    liveSuggestedBpm: null,
    waveformAnomalies: [],
    selectedAnomalyId: null,
  };
}

export function sanitizeLiveLogStreamUpdate(
  update: LiveLogStreamUpdate,
): SanitizedLiveLogStreamUpdate {
  const parsedLines = Array.isArray(update.parsedLines) ? update.parsedLines : [];
  const cueBatch = Array.isArray(update.sonificationCues) ? update.sonificationCues : [];
  const anomalyMarkers = Array.isArray(update.anomalyMarkers) ? update.anomalyMarkers : [];
  const hasRealLines = parsedLines.length > 0;
  const hasRealSignals =
    (update.lineCount ?? 0) > 0 || anomalyMarkers.length > 0 || cueBatch.length > 0;

  return {
    parsedLines,
    cueBatch,
    anomalyMarkers,
    hasRealLines,
    hasRealSignals,
    hasMeaningfulUpdate: Boolean(update.hasData && (hasRealLines || hasRealSignals)),
    suggestedBpm:
      typeof update.suggestedBpm === "number" && Number.isFinite(update.suggestedBpm)
        ? update.suggestedBpm
        : null,
  };
}

export function resolveMonitorWaveContext(input: {
  activeAudio?: Pick<HTMLAudioElement, "duration" | "currentTime"> | null;
  fallbackDurationSeconds?: number | null;
  fallbackProgress: number;
  liveSuggestedBpm: number | null;
  trackBpm: number | null;
}): MonitorWaveContextSnapshot {
  const durationSeconds = input.activeAudio?.duration ?? input.fallbackDurationSeconds ?? null;
  const currentProgress =
    input.activeAudio && input.activeAudio.duration > 0
      ? clamp01(input.activeAudio.currentTime / input.activeAudio.duration)
      : clamp01(input.fallbackProgress);

  return {
    durationSeconds,
    currentProgress,
    bpm: input.liveSuggestedBpm ?? input.trackBpm ?? null,
  };
}

export function resolveInitialSelectedAnomalyId(
  currentSelectedAnomalyId: string | null,
  parsedLines: MonitorLogLine[],
): string | null {
  if (currentSelectedAnomalyId) {
    return currentSelectedAnomalyId;
  }

  return parsedLines.find((line) => line.isAnomaly && line.anomalyId)?.anomalyId ?? null;
}

export function buildWaveformAnomalyMarkers(input: {
  previous: WaveformAnomalyMarker[];
  parsedLines: MonitorLogLine[];
  currentTrack: LibraryTrack | null;
  durationSeconds: number | null | undefined;
  bpm: number | null | undefined;
  currentProgress: number;
  beatSnapSubdivision: number;
  maxMarkers?: number;
  maxBatchMarkers?: number;
}): WaveformAnomalyMarker[] {
  const retained = input.previous.filter((marker) => marker.progress >= 0 && marker.progress <= 1);
  const anomalyLines = input.parsedLines.filter((line) => line.isAnomaly && line.anomalyId);
  const beatGrid = input.currentTrack?.analysis?.beatGrid ?? input.currentTrack?.beatGrid ?? [];
  const nextMarkers = anomalyLines.slice(0, input.maxBatchMarkers ?? 3).map((line, index) => ({
    id: line.anomalyId ?? `${line.id}-marker`,
    lineId: line.id,
    timestamp: line.timestamp,
    message: line.message,
    severity: line.level === "error" ? 1 : 0.72,
    progress: quantizeProgressToBeatGrid(
      clamp01(input.currentProgress + index * 0.0025),
      input.durationSeconds,
      input.bpm,
      beatGrid,
      input.beatSnapSubdivision,
    ),
  }));

  return [...retained, ...nextMarkers].slice(-(input.maxMarkers ?? 24));
}

export function buildMonitorLiveStreamHookState(
  input: MonitorLiveStreamHookState,
): MonitorLiveStreamHookState {
  return {
    liveLines: input.liveLines,
    logSignalBuffer: input.logSignalBuffer,
    liveSuggestedBpm: input.liveSuggestedBpm,
    waveformAnomalies: input.waveformAnomalies,
    selectedAnomalyId: input.selectedAnomalyId,
    setSelectedAnomalyId: input.setSelectedAnomalyId,
    simulateLog: input.simulateLog,
  };
}

export function buildSimulatedMonitorLogLine(input: {
  nowMs: number;
  randomValue?: number;
  now?: Date;
}): MonitorLogLine {
  const levels: MonitorLogLine["level"][] = ["info", "warn", "error", "debug"];
  const messages = [
    "SYNTH_PULSE_DETECTED: Signal strength at 89%",
    "NODE_HANDSHAKE: Peer connection established",
    "ANOMALY_TRIGGER: Out-of-bounds telemetry detected",
    "BUFFER_FLUSH: Real-time stream synchronized",
    "MAIA_CORE: Sonification engine optimized",
  ];
  const sample = input.randomValue ?? Math.random();
  const levelIndex = Math.min(levels.length - 1, Math.floor(sample * levels.length));
  const messageIndex = Math.min(messages.length - 1, Math.floor(sample * messages.length));
  const level = levels[levelIndex]!;

  return {
    id: `sim-${input.nowMs}`,
    timestamp: (input.now ?? new Date(input.nowMs)).toLocaleTimeString().split(" ")[0],
    level,
    message: messages[messageIndex]!,
    isAnomaly: level === "error" || level === "warn",
    anomalyId: level === "error" || level === "warn" ? `sim-anomaly-${input.nowMs}` : null,
  };
}
