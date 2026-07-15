import type { LibraryTrack } from "../../types/library";
import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { MonitorDeckControls } from "./monitorDeckControls";
import { parseMonitorLogLine, type MonitorLogLine } from "./monitorLogParsing";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamSignalRuntime";
import { advanceActiveLogSignalBuffer } from "./monitorLiveStreamSignalRuntime";
import {
  buildWaveformAnomalyMarkers,
  resolveInitialSelectedAnomalyId,
  resolveMonitorWaveContext,
  sanitizeLiveLogStreamUpdate,
  type SanitizedLiveLogStreamUpdate,
} from "./monitorLiveStreamStateRuntime";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";

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
  nowMs?: number;
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
      nowMs: input.nowMs,
    }),
    nextSelectedAnomalyId: resolveInitialSelectedAnomalyId(input.selectedAnomalyId, parsed),
    nextLogSignalBuffer: advanceActiveLogSignalBuffer({
      previous: input.previousLogSignalBuffer,
      cueBatch: normalizedUpdate.cueBatch,
      anomalyMarkers: normalizedUpdate.anomalyMarkers,
      lineCount: parsed.length,
      warningCount: parsed.filter((line) => line.level === "warn").length,
      errorCount: parsed.filter((line) => line.level === "error").length,
      reactivityMix: input.controls.reactivity / 100,
      anomalyMix: input.controls.anomalyEmphasis / 100,
    }),
  };
}
