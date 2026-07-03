import type { SessionBaseMode } from "./sessionDisplay";

export function buildSessionLabelPlaceholder(input: {
  selectedBaseLabel: string | null;
  selectedSourceTitle: string | null;
  templateGenre: string | null;
  templateLabel: string | null;
  fallbackLabel: string;
}): string {
  if (input.selectedSourceTitle && input.selectedBaseLabel) {
    return `${input.selectedSourceTitle} · ${input.selectedBaseLabel} · ${input.templateGenre ?? ""}`;
  }

  return input.templateLabel ?? input.fallbackLabel;
}

export function resolvePlaybackPercent(activePlaybackProgress: number | null): number | null {
  if (typeof activePlaybackProgress !== "number") {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(activePlaybackProgress * 100)));
}

export function resolveReadyToRun(input: {
  baseMode: SessionBaseMode;
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
}): boolean {
  return Boolean(
    input.selectedSourceId &&
    (input.baseMode === "track" ? input.selectedTrackId : input.selectedPlaylistId),
  );
}

export function createSessionTimestampId(prefix: string, now = Date.now()): string {
  return `${prefix}_${now}`;
}
