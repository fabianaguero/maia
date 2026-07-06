import type { LibraryTrack } from "../../types/library";
import { quantizeProgressToBeatGrid, type WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { MonitorLogLine } from "./monitorLogParsing";
import type { MonitorWaveContextSnapshot } from "./monitorLiveStreamStateTypes";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
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
