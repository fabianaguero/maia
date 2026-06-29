function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function stopMonitorAudio(audio: HTMLAudioElement | null | undefined): void {
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}

export function disposeMonitorAudio(
  audio: HTMLAudioElement | null | undefined,
  url: string | null | undefined,
  revokeUrl: (url: string | null | undefined) => void,
): null {
  stopMonitorAudio(audio);
  revokeUrl(url);
  return null;
}

export interface MonitorTrackAudioSnapshot {
  progress: number;
  elapsedSeconds: number;
  durationSeconds: number | null;
}

export function readMonitorTrackAudioSnapshot(
  audio: HTMLAudioElement | null | undefined,
): MonitorTrackAudioSnapshot | null {
  if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) {
    return null;
  }

  return {
    progress: clamp01(audio.currentTime / audio.duration),
    elapsedSeconds: audio.currentTime,
    durationSeconds: audio.duration,
  };
}

export function prepareBackgroundMonitorAudio(
  audio: HTMLAudioElement,
  playbackUrl: string,
  currentUrl: string | null | undefined,
  revokeUrl: (url: string | null | undefined) => void,
): string {
  audio.loop = true;
  audio.volume = 1;
  audio.muted = false;
  audio.defaultMuted = false;
  audio.preload = "auto";
  audio.crossOrigin = "anonymous";

  if (audio.src !== playbackUrl) {
    stopMonitorAudio(audio);
    revokeUrl(currentUrl);
    audio.src = playbackUrl;
    audio.currentTime = 0;
    audio.load();
    return playbackUrl;
  }

  return currentUrl ?? playbackUrl;
}
