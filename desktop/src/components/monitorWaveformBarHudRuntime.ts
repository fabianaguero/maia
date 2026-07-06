import type { LiveLogStreamUpdate } from "../types/monitor";

import type { HUDLine } from "./monitorWaveformBarTypes";

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
