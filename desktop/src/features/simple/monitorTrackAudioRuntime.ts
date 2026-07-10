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
  audio.playbackRate = 1;
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

export function startMonitorAudioPlayback(
  audio: HTMLAudioElement,
  warn: (message: string, error: unknown) => void,
): void {
  let settled = false;

  const describeAudio = () =>
    `readyState=${audio.readyState} paused=${audio.paused} currentTime=${audio.currentTime.toFixed(
      2,
    )} duration=${Number.isFinite(audio.duration) ? audio.duration.toFixed(2) : "n/a"} src=${
      audio.currentSrc || audio.src || "none"
    }`;

  const start = () => {
    if (settled) {
      return;
    }

    void audio.play().then(
      () => {
        settled = true;
        console.info(`[MAIA:MonitorAudio] playback started ${describeAudio()}`);
      },
      (error) => {
        warn(`Simple monitor background playback failed (${describeAudio()})`, error);
      },
    );
  };

  const retryStart = () => {
    if (settled) {
      return;
    }

    start();
  };

  if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    start();
    return;
  }

  audio.addEventListener("loadedmetadata", retryStart, { once: true });
  audio.addEventListener("canplay", retryStart, { once: true });
  audio.addEventListener("canplaythrough", retryStart, { once: true });

  start();
}
