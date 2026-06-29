import type { LibraryTrack } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorDeckControls } from "./monitorDeckControls";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import { parseMonitorLogLine, type MonitorLogLine } from "./monitorLogParsing";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamSignalRuntime";
import {
  advanceActiveLogSignalBuffer,
  advanceIdleLogSignalBuffer,
  advanceSimulatedLogSignalBuffer,
} from "./monitorLiveStreamSignalRuntime";
import {
  buildSimulatedMonitorLogLine,
  buildWaveformAnomalyMarkers,
  resolveInitialSelectedAnomalyId,
  resolveMonitorWaveContext,
  sanitizeLiveLogStreamUpdate,
  type SanitizedLiveLogStreamUpdate,
} from "./monitorLiveStreamStateRuntime";

export interface MonitorLiveStreamUpdateState {
  normalizedUpdate: SanitizedLiveLogStreamUpdate;
  nextLiveSuggestedBpm: number | null;
  nextLiveLines: MonitorLogLine[];
  nextWaveformAnomalies: WaveformAnomalyMarker[];
  nextSelectedAnomalyId: string | null;
  nextLogSignalBuffer: MonitorLogSignalPoint[];
}

export function buildMonitorLiveStreamUpdateState(input: {
  update: LiveLogStreamUpdate;
  currentTrack: LibraryTrack | null;
  activeAudio?: Pick<HTMLAudioElement, "duration" | "currentTime"> | null;
  fallbackDurationSeconds: number | null;
  fallbackProgress: number;
  liveSuggestedBpm: number | null;
  selectedAnomalyId: string | null;
  controls: MonitorDeckControls;
  maxLiveLines: number;
  previousLiveLines: MonitorLogLine[];
  previousWaveformAnomalies: WaveformAnomalyMarker[];
  previousLogSignalBuffer: MonitorLogSignalPoint[];
}): MonitorLiveStreamUpdateState {
  const normalizedUpdate = sanitizeLiveLogStreamUpdate(input.update);
  const parsed = normalizedUpdate.parsedLines.map((raw, lineIndex) =>
    parseMonitorLogLine(raw, lineIndex),
  );
  const waveContext = resolveMonitorWaveContext({
    activeAudio: input.activeAudio,
    fallbackDurationSeconds: input.fallbackDurationSeconds,
    fallbackProgress: input.fallbackProgress,
    liveSuggestedBpm: input.liveSuggestedBpm,
    trackBpm: input.currentTrack?.analysis?.bpm ?? null,
  });

  return {
    normalizedUpdate,
    nextLiveSuggestedBpm: normalizedUpdate.suggestedBpm,
    nextLiveLines: [...input.previousLiveLines, ...parsed].slice(-input.maxLiveLines),
    nextWaveformAnomalies: buildWaveformAnomalyMarkers({
      previous: input.previousWaveformAnomalies,
      parsedLines: parsed,
      currentTrack: input.currentTrack,
      durationSeconds: waveContext.durationSeconds,
      bpm: waveContext.bpm,
      currentProgress: waveContext.currentProgress,
      beatSnapSubdivision: input.controls.beatSnapSubdivision,
    }),
    nextSelectedAnomalyId: resolveInitialSelectedAnomalyId(input.selectedAnomalyId, parsed),
    nextLogSignalBuffer: advanceActiveLogSignalBuffer({
      previous: input.previousLogSignalBuffer,
      cueBatch: normalizedUpdate.cueBatch,
      anomalyMarkers: normalizedUpdate.anomalyMarkers,
      reactivityMix: input.controls.reactivity / 100,
      anomalyMix: input.controls.anomalyEmphasis / 100,
    }),
  };
}

export function buildMonitorLiveStreamIdleState(input: {
  previous: MonitorLogSignalPoint[];
  nowMs: number;
  idleForMs: number;
  idleHoldMs: number;
  idleMix: number;
  effectiveBpm: number | null;
}): MonitorLogSignalPoint[] {
  if (input.idleForMs < input.idleHoldMs) {
    return input.previous;
  }

  return advanceIdleLogSignalBuffer({
    previous: input.previous,
    nowMs: input.nowMs,
    idleMix: input.idleMix,
    effectiveBpm: input.effectiveBpm,
  });
}

export function buildSimulatedMonitorState(input: {
  nowMs: number;
  previousLiveLines: MonitorLogLine[];
  previousLogSignalBuffer: MonitorLogSignalPoint[];
  randomValue?: number;
  maxLiveLines?: number;
}) {
  const mock = buildSimulatedMonitorLogLine({
    nowMs: input.nowMs,
    randomValue: input.randomValue,
  });

  return {
    mock,
    nextLiveLines: [mock, ...input.previousLiveLines].slice(0, input.maxLiveLines ?? 50),
    nextLogSignalBuffer: advanceSimulatedLogSignalBuffer(
      input.previousLogSignalBuffer,
      mock.level,
    ),
  };
}
