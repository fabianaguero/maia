import type { SessionEvent } from "../../api/sessions";

export interface SessionBedAudioLike {
  currentTime: number;
  loop: boolean;
  pause: () => void;
  play: () => Promise<unknown>;
  preload: string;
  src: string;
  volume: number;
}

export interface SessionScreenAudioRef {
  current: SessionBedAudioLike | null;
}

export function ensureSessionBedAudio(
  audioRef: SessionScreenAudioRef,
  createAudio: () => SessionBedAudioLike,
): SessionBedAudioLike {
  let audio = audioRef.current;
  if (!audio) {
    audio = createAudio();
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.2;
    audioRef.current = audio;
  }
  return audio;
}

export function resetSessionBedAudio(audio: SessionBedAudioLike): void {
  audio.pause();
  audio.currentTime = 0;
  audio.src = "";
}

export function cleanupSessionBedAudio(audioRef: SessionScreenAudioRef): void {
  const audio = audioRef.current;
  if (!audio) {
    return;
  }

  audio.pause();
  audio.src = "";
  audioRef.current = null;
}

export async function syncSessionBedAudio(
  audio: SessionBedAudioLike,
  activeBedUrl: string | null,
): Promise<void> {
  if (!activeBedUrl) {
    resetSessionBedAudio(audio);
    return;
  }

  if (audio.src !== activeBedUrl) {
    audio.pause();
    audio.src = activeBedUrl;
    audio.currentTime = 0;
  }

  try {
    await audio.play();
  } catch {
    // Ignore autoplay/playback failures in the passive booth bed layer.
  }
}

export async function loadSessionScreenEvents(
  sessionId: string | null,
  listEvents: (sessionId: string) => Promise<SessionEvent[]>,
): Promise<SessionEvent[]> {
  if (!sessionId) {
    return [];
  }

  try {
    return await listEvents(sessionId);
  } catch {
    return [];
  }
}
