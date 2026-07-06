import type { MonitorTrackAudioSnapshot } from "./monitorTrackAudioRuntime";

export type MonitorPreviewAction = "skip" | "stop-current-preview" | "replace-preview" | "start";

export function resolveMonitorPreviewAction(input: {
  playablePath: string | null;
  previewTrackId: string | null;
  nextTrackId: string;
  hasPreviewAudio: boolean;
}): MonitorPreviewAction {
  if (!input.playablePath) {
    return "skip";
  }

  if (input.previewTrackId === input.nextTrackId && input.hasPreviewAudio) {
    return "stop-current-preview";
  }

  if (input.hasPreviewAudio) {
    return "replace-preview";
  }

  return "start";
}

export function buildMonitorPreviewEndedState() {
  return {
    previewTrackId: null,
    previewUrl: null,
    clearPreviewAudio: true,
  };
}

export function buildMonitorTrackAudioResetState() {
  return {
    trackWaveProgress: 0,
    trackElapsedSeconds: 0,
    trackDurationSeconds: null,
    clearBackgroundAudio: true,
    clearBackgroundUrl: true,
  };
}

export function shouldBindMonitorBackgroundTrack(input: {
  safeRuntime: boolean;
  isListening: boolean;
  hasActiveTrack: boolean;
}): boolean {
  return !input.safeRuntime && input.isListening && input.hasActiveTrack;
}

export function shouldStartMonitorProgressLoop(input: {
  safeRuntime: boolean;
  isListening: boolean;
}): boolean {
  return !input.safeRuntime && input.isListening;
}

export function buildMonitorTrackProgressState(snapshot: MonitorTrackAudioSnapshot | null) {
  if (!snapshot) {
    return null;
  }

  return {
    trackWaveProgress: snapshot.progress,
    trackElapsedSeconds: snapshot.elapsedSeconds,
    trackDurationSeconds: snapshot.durationSeconds,
  };
}
