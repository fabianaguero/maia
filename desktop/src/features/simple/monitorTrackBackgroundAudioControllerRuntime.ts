import {
  prepareBackgroundMonitorAudio,
  startMonitorAudioPlayback,
} from "./monitorTrackAudioRuntime";

export function applyMonitorTrackBackgroundBindingState(input: {
  currentBackgroundAudio: HTMLAudioElement | null;
  currentBackgroundAudioUrl: string | null;
  playbackUrl: string;
  createAudio: () => HTMLAudioElement;
  revokePreviewUrl: (url: string | null | undefined) => void;
  warn: (message: string, error: unknown) => void;
}): {
  backgroundAudio: HTMLAudioElement;
  backgroundAudioUrl: string;
} {
  const audio = input.currentBackgroundAudio ?? input.createAudio();
  const backgroundAudioUrl = prepareBackgroundMonitorAudio(
    audio,
    input.playbackUrl,
    input.currentBackgroundAudioUrl,
    input.revokePreviewUrl,
  );

  startMonitorAudioPlayback(audio, input.warn);

  return {
    backgroundAudio: audio,
    backgroundAudioUrl,
  };
}
