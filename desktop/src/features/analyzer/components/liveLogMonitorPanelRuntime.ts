import type { LiveLogStreamUpdate } from "../../../types/library";
import {
  resolveBackgroundTrackSecond,
  resolveParsedLineTone,
  resolveTailComponent,
  buildSyncTailRows,
  appendSyncTailRows,
  type ParsedLineTone,
} from "./liveLogMonitorSyncRuntime";

export type { BackgroundDeckPlaybackState, SyncTailRow } from "./liveLogMonitorSyncRuntime";

export interface AnomalySourceRow {
  sourcePath: string;
  component: string;
  level: string;
  line: string;
  tone: ParsedLineTone;
}

export function formatCursor(offset: number | undefined): string {
  if (typeof offset !== "number" || Number.isNaN(offset)) {
    return "Tail seed";
  }

  return `${offset.toLocaleString()} B`;
}

export function formatConfidence(confidence: number): string {
  if (!Number.isFinite(confidence) || confidence <= 0) {
    return "--";
  }

  return `${Math.round(confidence * 100)}%`;
}

export function formatFrequency(noteHz: number): string {
  return `${Math.round(noteHz)} Hz`;
}

export function levelCount(levelCounts: Record<string, number>, level: string): number {
  return levelCounts[level] ?? 0;
}

export function resolveAnomalySourceRows(
  update: LiveLogStreamUpdate | null,
  maxRows: number,
): AnomalySourceRow[] {
  if (!update) {
    return [];
  }

  const rows: AnomalySourceRow[] = [];
  const seen = new Set<string>();

  for (const marker of update.anomalyMarkers) {
    const line = marker.excerpt.trim();
    if (!line) {
      continue;
    }
    const key = line.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push({
      sourcePath: update.sourcePath,
      component: marker.component || "stream",
      level: marker.level || "anomaly",
      line,
      tone: resolveParsedLineTone(line, update.anomalyMarkers),
    });
    if (rows.length >= maxRows) {
      return rows;
    }
  }

  for (const parsedLine of update.parsedLines) {
    const line = parsedLine.trim();
    if (!line) {
      continue;
    }
    const tone = resolveParsedLineTone(line, update.anomalyMarkers);
    if (tone === "info") {
      continue;
    }
    const key = line.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    rows.push({
      sourcePath: update.sourcePath,
      component: "stream",
      level: tone,
      line,
      tone,
    });
    if (rows.length >= maxRows) {
      break;
    }
  }

  return rows;
}

export {
  appendSyncTailRows,
  buildSyncTailRows,
  resolveBackgroundTrackSecond,
  resolveParsedLineTone,
  resolveTailComponent,
};
