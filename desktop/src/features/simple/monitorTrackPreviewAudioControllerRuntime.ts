import { disposeMonitorAudio } from "./monitorTrackAudioRuntime";
import { buildMonitorPreviewEndedState } from "./monitorTrackAudioOrchestrationRuntime";

export function buildMonitorPreviewAudio(input: {
  previewUrl: string;
  createAudio: (src: string) => HTMLAudioElement;
}): HTMLAudioElement {
  const audio = input.createAudio(input.previewUrl);
  audio.volume = 0.92;
  audio.preload = "auto";
  return audio;
}

export function disposeMonitorPreviewState(input: {
  previewAudio: HTMLAudioElement | null;
  previewUrl: string | null;
  revokePreviewUrl: (url: string | null | undefined) => void;
}): {
  previewAudio: null;
  previewUrl: null;
  previewTrackId: null;
} {
  return {
    previewAudio: disposeMonitorAudio(input.previewAudio, input.previewUrl, input.revokePreviewUrl),
    previewUrl: null,
    previewTrackId: null,
  };
}

export function applyMonitorPreviewEndedState(input: {
  currentPreviewAudio: HTMLAudioElement | null;
  endedAudio: HTMLAudioElement;
  currentPreviewUrl: string | null;
  revokePreviewUrl: (url: string | null | undefined) => void;
}): {
  shouldApply: boolean;
  previewAudio: HTMLAudioElement | null;
  previewUrl: string | null;
  previewTrackId: string | null;
} {
  if (input.currentPreviewAudio !== input.endedAudio) {
    return {
      shouldApply: false,
      previewAudio: input.currentPreviewAudio,
      previewUrl: input.currentPreviewUrl,
      previewTrackId: null,
    };
  }

  const endedState = buildMonitorPreviewEndedState();
  input.revokePreviewUrl(input.currentPreviewUrl);

  return {
    shouldApply: true,
    previewAudio: endedState.clearPreviewAudio ? null : input.currentPreviewAudio,
    previewUrl: endedState.previewUrl,
    previewTrackId: endedState.previewTrackId,
  };
}

export function applyMonitorPreviewPlayFailureState(input: {
  currentPreviewAudio: HTMLAudioElement | null;
  failedAudio: HTMLAudioElement;
  currentPreviewUrl: string | null;
  revokePreviewUrl: (url: string | null | undefined) => void;
}): {
  previewAudio: HTMLAudioElement | null;
  previewUrl: string | null;
  previewTrackId: string | null;
} {
  input.revokePreviewUrl(input.currentPreviewUrl);

  return {
    previewAudio:
      input.currentPreviewAudio === input.failedAudio ? null : input.currentPreviewAudio,
    previewUrl: null,
    previewTrackId: null,
  };
}
