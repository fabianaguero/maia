import type { LiveLogCue, LiveLogStreamUpdate } from "../types/monitor";

export interface WaveMetrics {
  low: number;
  mid: number;
  high: number;
}

export interface WaveColumn {
  source: WaveMetrics;
  processed: WaveMetrics;
  anomalyHeat: number;
  logLine: string | null;
}

export interface HUDLine {
  id: string;
  content: string;
  heat: number;
  timestamp: number;
}

export const MONITOR_WAVEFORM_HISTORY_SIZE = 400;

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

export function buildHudLinesForUpdate(
  update: LiveLogStreamUpdate,
  options: {
    isPlayback: boolean;
    lastOffset: number;
    now?: number;
    randomValue?: number;
    maxLines?: number;
  },
): { hudLines: HUDLine[]; nextOffset: number } {
  const {
    isPlayback,
    lastOffset,
    now = Date.now(),
    randomValue = Math.random(),
    maxLines = 8,
  } = options;

  const isNewData = isPlayback || update.toOffset > lastOffset;
  if (!isNewData) {
    return { hudLines: [], nextOffset: lastOffset };
  }

  const heat = Math.min(1, update.anomalyMarkers.length * 0.4);
  const newLines: HUDLine[] = [];

  if (update.parsedLines && update.parsedLines.length > 0) {
    update.parsedLines.forEach((content, index) => {
      newLines.push({
        id: `${update.toOffset}-${index}-${randomValue}`,
        content,
        heat,
        timestamp: now,
      });
    });
  } else if (update.anomalyMarkers && update.anomalyMarkers.length > 0) {
    update.anomalyMarkers.forEach((marker, index) => {
      newLines.push({
        id: `anomaly-${update.toOffset}-${index}`,
        content: `[ANOMALY] ${marker.component}: ${marker.excerpt}`,
        heat: 0.8,
        timestamp: now,
      });
    });
  } else if (update.lineCount > 0 && !isPlayback) {
    newLines.push({
      id: `burst-${update.toOffset}`,
      content: `>> Ingesting telemetry burst: ${update.lineCount} lines`,
      heat: 0.2,
      timestamp: now,
    });
  }

  return {
    hudLines: newLines.reverse().slice(0, maxLines),
    nextOffset: update.toOffset,
  };
}
