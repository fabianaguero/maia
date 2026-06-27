import type {
  LiveLogCue,
  LiveLogMarker,
} from "../../types/monitor";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { LibraryTrack } from "../../types/library";
import { getBasename } from "./monitorDisplay";
import { resolveBurstFactor } from "./monitorAudioMutation";
import type { MonitorDeckControls } from "./monitorDeckControls";
import { quantizeProgressToBeatGrid, type WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { MonitorLogLine } from "./monitorLogParsing";

export interface MonitorLogSignalPoint {
  val: number;
  heat: number;
}

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
  setSelectedAnomalyId: (value: string | null | ((current: string | null) => string | null)) => void;
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

export function createMonitorSignalBuffer(
  length = 120,
  seed: MonitorLogSignalPoint = { val: 10, heat: 0 },
): MonitorLogSignalPoint[] {
  return Array.from({ length }, () => ({ ...seed }));
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

export function shouldEmitMonitorCueAccent(input: {
  update: Pick<LiveLogStreamUpdate, "lineCount" | "anomalyCount" | "levelCounts" | "anomalyMarkers">;
  cueBatch: LiveLogCue[];
  controls: MonitorDeckControls;
  hasMeaningfulUpdate: boolean;
  hasBackgroundTrack: boolean;
  lastCueAccentAtMs: number;
  nowMs: number;
}): boolean {
  const {
    update,
    cueBatch,
    controls,
    hasMeaningfulUpdate,
    hasBackgroundTrack,
    lastCueAccentAtMs,
    nowMs,
  } = input;
  const reactivityMix = controls.reactivity / 100;
  const anomalyMix = controls.anomalyEmphasis / 100;
  const lineCount = Math.max(1, update.lineCount ?? 0);
  const anomalyPressure = Math.max(
    (update.anomalyCount ?? 0) / lineCount,
    ((update.levelCounts?.ERROR ?? update.levelCounts?.error ?? 0) +
      (update.levelCounts?.WARN ?? update.levelCounts?.warn ?? 0) * 0.4) /
      lineCount,
  );
  const burstFactor = resolveBurstFactor(update.anomalyMarkers);
  const anomalyDrivenCue =
    cueBatch.find((cue) => cue.accent === "anomaly") ??
    cueBatch.find((cue) => (cue.gain ?? 0) >= 0.12) ??
    null;
  const anomalyPressureThreshold = 0.38 - anomalyMix * 0.2;
  const burstSuppressionThreshold = 0.8 - reactivityMix * 0.12;

  return Boolean(
    hasMeaningfulUpdate &&
      anomalyPressure >= anomalyPressureThreshold &&
      burstFactor < burstSuppressionThreshold &&
      anomalyDrivenCue &&
      (!hasBackgroundTrack || nowMs - lastCueAccentAtMs >= controls.cueCooldownMs),
  );
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

export function advanceActiveLogSignalBuffer(input: {
  previous: MonitorLogSignalPoint[];
  cueBatch: LiveLogCue[];
  anomalyMarkers: LiveLogMarker[];
  reactivityMix: number;
  anomalyMix: number;
  randomValue?: number;
}): MonitorLogSignalPoint[] {
  let val = 20;
  let heat = 0;

  if (input.cueBatch.length > 0 || input.anomalyMarkers.length > 0) {
    const avgGain =
      input.cueBatch.length > 0
        ? input.cueBatch.reduce((sum, cue) => sum + (cue.gain ?? 0), 0) / input.cueBatch.length
        : 0;
    val = 20 + Math.min(120, avgGain * 150 * (0.45 + input.reactivityMix * 0.85));
    heat =
      input.anomalyMarkers.length > 0
        ? Math.min(
            1,
            (0.28 + Math.min(0.72, input.anomalyMarkers.length * 0.1)) *
              (0.35 + input.anomalyMix * 0.65),
          )
        : 0;
  } else {
    val = 24 + (input.randomValue ?? Math.random()) * (6 + input.reactivityMix * 10);
  }

  const nextBuffer = [...input.previous];
  for (let index = 0; index < 60; index += 1) {
    nextBuffer[index] = input.previous[index + 1] || { val: 20, heat: 0 };
  }
  const previousCenter = input.previous[60] || { val: 20, heat: 0 };
  nextBuffer[60] = {
    val: previousCenter.val * 0.52 + val * 0.48,
    heat: previousCenter.heat * 0.35 + heat * 0.65,
  };
  for (let index = 61; index < 120; index += 1) {
    const decay = 1 - (index - 60) / 60;
    const eased = Math.max(0, decay * decay);
    const prevFuture = input.previous[index] || { val: 20, heat: 0 };
    nextBuffer[index] = {
      val: 20 + (nextBuffer[60].val - 20) * eased * 0.52 + (prevFuture.val - 20) * 0.26,
      heat: nextBuffer[60].heat * eased * 0.62 + prevFuture.heat * 0.18,
    };
  }

  return nextBuffer;
}

export function advanceIdleLogSignalBuffer(input: {
  previous: MonitorLogSignalPoint[];
  nowMs: number;
  idleMix: number;
  effectiveBpm: number | null;
}): MonitorLogSignalPoint[] {
  const idlePulse =
    18 +
    Math.sin(input.nowMs / 420) * (1 + input.idleMix * 5) +
    Math.sin(input.nowMs / 880) * (0.6 + input.idleMix * 2.8) +
    (typeof input.effectiveBpm === "number"
      ? Math.sin((input.nowMs / 60000) * input.effectiveBpm * Math.PI * 2) *
        (0.5 + input.idleMix * 2.2)
      : 0);
  const nextBuffer = [...input.previous];
  for (let index = 0; index < 60; index += 1) {
    nextBuffer[index] = input.previous[index + 1] || { val: 20, heat: 0 };
  }
  const previousCenter = input.previous[60] || { val: 20, heat: 0 };
  nextBuffer[60] = {
    val: previousCenter.val * (0.9 - input.idleMix * 0.22) + idlePulse * (0.1 + input.idleMix * 0.22),
    heat: previousCenter.heat * (0.82 - input.idleMix * 0.22),
  };
  for (let index = 61; index < 120; index += 1) {
    const decay = 1 - (index - 60) / 60;
    const eased = Math.max(0, decay * decay);
    const future = input.previous[index] || { val: 20, heat: 0 };
    nextBuffer[index] = {
      val:
        20 +
        (nextBuffer[60].val - 20) * eased * (0.16 + input.idleMix * 0.38) +
        (future.val - 20) * (0.48 - input.idleMix * 0.2),
      heat: future.heat * (0.82 - input.idleMix * 0.18),
    };
  }

  return nextBuffer;
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

export function advanceSimulatedLogSignalBuffer(
  previous: MonitorLogSignalPoint[],
  level: MonitorLogLine["level"],
): MonitorLogSignalPoint[] {
  const heat = level === "error" ? 1 : level === "warn" ? 0.5 : 0;
  const val = 40 + heat * 100;
  const nextBuffer = [...previous];

  for (let index = 0; index < 60; index += 1) {
    nextBuffer[index] = previous[index + 1] || { val: 20, heat: 0 };
  }

  nextBuffer[60] = { val, heat };

  for (let index = 61; index < 120; index += 1) {
    nextBuffer[index] = { val: 20, heat: 0 };
  }

  return nextBuffer;
}
