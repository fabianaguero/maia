import type { AppTranslations } from "../../../i18n/types";

export type ManagedAudioPlaybackState =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "error"
  | "unavailable";

export function formatManagedAudioDuration(durationSeconds: number | null): string {
  if (!durationSeconds || durationSeconds <= 0) {
    return "--:--";
  }

  const totalSeconds = Math.round(durationSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function canManagedAudioAttemptPlayback(
  audioPath: string | null,
  isDesktopShell: boolean,
): boolean {
  return Boolean(audioPath && isDesktopShell && !audioPath.startsWith("browser-fallback://"));
}

export function resolveManagedAudioInitialState(input: {
  audioPath: string | null;
  isDesktopShell: boolean;
}): ManagedAudioPlaybackState {
  if (canManagedAudioAttemptPlayback(input.audioPath, input.isDesktopShell)) {
    return "loading";
  }

  return input.audioPath ? "unavailable" : "idle";
}

export function mimeTypeFromPath(audioPath: string): string {
  const ext = audioPath.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
    m4a: "audio/mp4",
    aac: "audio/mp4",
    opus: "audio/ogg",
    webm: "audio/webm",
  };
  return map[ext] ?? "audio/mpeg";
}

export function describeManagedAudioState(
  state: ManagedAudioPlaybackState,
  t: AppTranslations,
): string {
  switch (state) {
    case "loading":
      return t.inspect.playbackLoading;
    case "ready":
      return t.inspect.playbackReady;
    case "playing":
      return t.inspect.playbackPlaying;
    case "error":
      return t.inspect.playbackErrorState;
    case "unavailable":
      return t.inspect.desktopPlaybackOnly;
    default:
      return t.inspect.playbackPending;
  }
}

export function resolveManagedAudioShownDuration(
  resolvedDurationSeconds: number,
  durationSeconds: number | null,
): number | null {
  return resolvedDurationSeconds > 0 ? resolvedDurationSeconds : durationSeconds;
}

export function resolveManagedAudioScrubberRange(input: {
  currentTimeSeconds: number;
  shownDurationSeconds: number | null;
}): { max: number; value: number } {
  const max =
    input.shownDurationSeconds && input.shownDurationSeconds > 0 ? input.shownDurationSeconds : 1;

  return {
    max,
    value: Math.min(input.currentTimeSeconds, max),
  };
}

export function resolveManagedAudioCueTargetSecond(input: {
  cueSecond: number;
  resolvedDurationSeconds: number;
  durationSeconds: number | null;
}): number {
  const maxDuration =
    input.resolvedDurationSeconds > 0
      ? input.resolvedDurationSeconds
      : (input.durationSeconds ?? 0);

  return maxDuration > 0
    ? Math.min(Math.max(0, input.cueSecond), maxDuration)
    : Math.max(0, input.cueSecond);
}

export function shouldManagedAudioResetBeforeReplay(input: {
  resolvedDurationSeconds: number;
  currentTimeSeconds: number;
}): boolean {
  return (
    input.resolvedDurationSeconds > 0 &&
    input.currentTimeSeconds >= input.resolvedDurationSeconds - 0.1
  );
}

export function resolveManagedAudioLoadError(error: unknown): string {
  return `Cannot load audio: ${String(error)}`;
}

export function resolveManagedAudioCueError(error: unknown): string {
  return error instanceof Error ? error.message : "Maia could not jump to the requested cue.";
}

export function resolveManagedAudioToggleError(error: unknown): string {
  return error instanceof Error ? error.message : "Maia could not start local audio playback.";
}

export function resolveManagedAudioNote(input: {
  audioPath: string | null;
  blobReady: boolean;
  playbackState: ManagedAudioPlaybackState;
  missingNote: string;
  browserFallbackNote: string;
  desktopOnlyNote: string;
  availableNote: string;
}): string {
  if (!input.audioPath) {
    return input.missingNote;
  }

  if (input.audioPath.startsWith("browser-fallback://")) {
    return input.browserFallbackNote;
  }

  if (!input.blobReady && input.playbackState === "unavailable") {
    return input.desktopOnlyNote;
  }

  return input.availableNote;
}
