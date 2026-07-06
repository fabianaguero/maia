export interface ManagedBlobAudioElement {
  volume: number;
  currentTime: number;
  pause: () => void;
  play: () => Promise<unknown>;
  addEventListener: (type: string, listener: () => void, options?: AddEventListenerOptions) => void;
}

export interface ManagedBlobAudioRuntimeLogger {
  warn: (message: string, ...args: unknown[]) => void;
}

export function createManagedBlobAudioRegistry(): Set<ManagedBlobAudioElement> {
  return new Set<ManagedBlobAudioElement>();
}

export function setBlobAudioVolumeState(
  activeBlobAudioElements: Set<ManagedBlobAudioElement>,
  volume: number,
): void {
  const nextVolume = Math.max(0, Math.min(1, volume));
  activeBlobAudioElements.forEach((audio) => {
    audio.volume = nextVolume;
  });
}

export function stopManagedBlobAudioState(
  activeBlobAudioElements: Set<ManagedBlobAudioElement>,
): void {
  activeBlobAudioElements.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeBlobAudioElements.clear();
}

export function playManagedWavBlobState(input: {
  blob: Blob;
  volume: number;
  activeBlobAudioElements: Set<ManagedBlobAudioElement>;
  createObjectUrl: (blob: Blob) => string;
  revokeObjectUrl: (url: string) => void;
  createAudio: (url: string) => ManagedBlobAudioElement;
  setTimeoutFn: (handler: () => void, timeout: number) => unknown;
  logger: ManagedBlobAudioRuntimeLogger;
}): void {
  const url = input.createObjectUrl(input.blob);
  const audio = input.createAudio(url);
  audio.volume = Math.max(0, Math.min(1, input.volume));
  input.activeBlobAudioElements.add(audio);

  const cleanup = () => {
    input.activeBlobAudioElements.delete(audio);
    input.revokeObjectUrl(url);
  };

  audio.addEventListener("ended", cleanup, { once: true });
  void audio.play().catch((error) => {
    input.logger.warn("[Maia Audio] WAV playback failed:", error);
    cleanup();
  });

  input.setTimeoutFn(() => {
    if (input.activeBlobAudioElements.has(audio)) {
      input.activeBlobAudioElements.delete(audio);
      input.revokeObjectUrl(url);
    }
  }, 5000);
}
