import type { LiveLogMarker, LiveLogStreamUpdate } from "../../../types/library";

export type ParsedLineTone = "error" | "warn" | "anomaly" | "info";

export interface SyncTailRow {
  id: string;
  windowId: string;
  sourcePath: string;
  component: string;
  level: string;
  line: string;
  tone: ParsedLineTone;
}

export interface BackgroundDeckPlaybackState {
  startedAtContextTime: number;
  bufferDurationSec: number;
  entrySecond: number;
  playbackRate: number;
  looping: boolean;
}

export function resolveBackgroundTrackSecond(
  context: Pick<AudioContext, "currentTime"> | null,
  deck: BackgroundDeckPlaybackState | null,
): number | null {
  if (!context || !deck) {
    return null;
  }

  const elapsedSeconds = Math.max(0, context.currentTime - deck.startedAtContextTime);
  const rawSecond = deck.entrySecond + elapsedSeconds * deck.playbackRate;

  if (deck.looping && deck.bufferDurationSec > 0) {
    return Number((rawSecond % deck.bufferDurationSec).toFixed(3));
  }

  return Number(Math.min(deck.bufferDurationSec, rawSecond).toFixed(3));
}

export function resolveParsedLineTone(line: string, markers: LiveLogMarker[]): ParsedLineTone {
  const normalizedLine = line.trim().toLowerCase();
  const matchesMarker = markers.some((marker) => {
    const excerpt = marker.excerpt.trim().toLowerCase();
    return (
      Boolean(excerpt) && (normalizedLine.includes(excerpt) || excerpt.includes(normalizedLine))
    );
  });

  if (matchesMarker || /\banomaly|drift|spike|budget\b/i.test(line)) {
    return "anomaly";
  }
  if (/\berror|fatal|exception|panic|failed|refused|critical\b/i.test(line)) {
    return "error";
  }
  if (/\bwarn|warning|timeout|retry|latency|slow|throttle\b/i.test(line)) {
    return "warn";
  }
  return "info";
}

export function resolveTailComponent(line: string, markers: LiveLogMarker[]): string {
  const normalized = line.trim().toLowerCase();
  const marker = markers.find((entry) => {
    const excerpt = entry.excerpt.trim().toLowerCase();
    return Boolean(excerpt) && (normalized.includes(excerpt) || excerpt.includes(normalized));
  });

  return marker?.component || "stream";
}

export function buildSyncTailRows(input: {
  update: LiveLogStreamUpdate;
  maxParsedLines: number;
}): SyncTailRow[] {
  const windowId = `${input.update.fromOffset}-${input.update.toOffset}-${input.update.replayWindowIndex ?? "live"}`;

  return (input.update.parsedLines || [])
    .filter((line) => line.trim().length > 0)
    .slice(-input.maxParsedLines)
    .map((line, index) => {
      const tone = resolveParsedLineTone(line, input.update.anomalyMarkers);
      const component = resolveTailComponent(line, input.update.anomalyMarkers);
      const level = tone === "anomaly" ? "anomaly" : tone;
      return {
        id: `${windowId}-${index}`,
        windowId,
        sourcePath: input.update.sourcePath,
        component,
        level,
        line,
        tone,
      } satisfies SyncTailRow;
    });
}

export function appendSyncTailRows(
  current: SyncTailRow[],
  next: SyncTailRow[],
  maxRows: number,
): SyncTailRow[] {
  if (next.length === 0) {
    return current;
  }

  return [...current, ...next].slice(-maxRows);
}
