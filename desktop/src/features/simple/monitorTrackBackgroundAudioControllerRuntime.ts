import { prepareBackgroundMonitorAudio } from "./monitorTrackAudioRuntime";

export function applyMonitorTrackBackgroundBindingState(input: {
  currentBackgroundAudio: HTMLAudioElement | null;
  currentBackgroundAudioUrl: string | null;
  playbackUrl: string;
  createAudio: () => HTMLAudioElement;
  revokePreviewUrl: (url: string | null | undefined) => void;
  audioContext: AudioContext | null;
  ensureBackgroundGraph: (audio: HTMLAudioElement, context: AudioContext) => unknown;
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

  if (input.audioContext?.state === "running") {
    input.ensureBackgroundGraph(audio, input.audioContext);
  }

  void audio.play().catch((error) => {
    input.warn("Simple monitor background playback failed", error);
  });

  return {
    backgroundAudio: audio,
    backgroundAudioUrl,
  };
}
