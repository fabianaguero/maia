import type { LiveLogCue, LiveLogStreamUpdate } from "../types/monitor";

import {
  MONITOR_WAVEFORM_HISTORY_SIZE,
  type WaveColumn,
  type WaveMetrics,
} from "./monitorWaveformBarTypes";

export function resolveSourceMetrics(
  update: LiveLogStreamUpdate,
  randomValue = Math.random(),
): WaveMetrics {
  const total = update.lineCount;
  if (total === 0) {
    return { low: 0, mid: 0, high: 0 };
  }

  const lc = update.levelCounts || {};
  const normalizedVolume = Math.min(1, Math.sqrt(total / 80));
  const voiceFloor = 0.15;
  const errorWeight = ((lc.error || 0) + (lc.warn || 0)) / total;

  return {
    low: Math.min(1, voiceFloor + errorWeight * 2.0 + normalizedVolume * 0.4),
    mid: Math.min(1, voiceFloor + normalizedVolume * 0.7),
    high: Math.min(1, voiceFloor + randomValue * 0.1 + normalizedVolume * 0.3),
  };
}

export function resolveProcessedMetrics(
  cues: LiveLogCue[],
  update: LiveLogStreamUpdate,
): WaveMetrics {
  if ((!cues || cues.length === 0) && update.anomalyMarkers.length === 0) {
    return { low: 0, mid: 0, high: 0 };
  }

  const anomalySignal =
    update.anomalyMarkers.length > 0 ? 0.3 + update.anomalyMarkers.length * 0.15 : 0;
  const avgGain = (cues || []).reduce((sum, cue) => sum + cue.gain, 0) / Math.max(1, cues.length);
  const gainFactor = Math.min(1, avgGain * 2.2);

  return {
    low: Math.min(1, anomalySignal * 1.2 + gainFactor * 0.4 + 0.1),
    mid: Math.min(1, gainFactor * 0.9 + 0.15),
    high: Math.min(1, gainFactor * 0.6 + 0.1),
  };
}

export function buildWaveColumn(
  update: LiveLogStreamUpdate,
  sourceMetrics: WaveMetrics,
  processedMetrics: WaveMetrics,
): WaveColumn {
  return {
    source: sourceMetrics,
    processed: processedMetrics,
    anomalyHeat: Math.min(1, update.anomalyMarkers.length * 0.4),
    logLine: update.parsedLines?.[0] || null,
  };
}

export function appendWaveHistory(
  history: WaveColumn[],
  column: WaveColumn,
  historySize = MONITOR_WAVEFORM_HISTORY_SIZE,
): WaveColumn[] {
  const next = [...history, column];
  return next.length > historySize ? next.slice(next.length - historySize) : next;
}
