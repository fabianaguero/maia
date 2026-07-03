import { mimeTypeFromPath, type ManagedAudioPlaybackState } from "./managedAudioPlayerRuntime";

export interface ManagedAudioBlobElement {
  duration: number;
  paused: boolean;
  currentTime: number;
  volume: number;
  src: string;
  pause: () => void;
  load: () => void;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

export function createManagedAudioBlobUrl(input: {
  audioPath: string;
  base64: string;
  createObjectUrl: (blob: Blob) => string;
}): string {
  const binary = atob(input.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeTypeFromPath(input.audioPath) });
  return input.createObjectUrl(blob);
}

export function bindManagedAudioBlobElement(input: {
  audio: ManagedAudioBlobElement;
  errorNote: string;
  onTimeUpdate?: (seconds: number) => void;
  setResolvedDurationSeconds: (value: number) => void;
  setPlaybackState: (value: ManagedAudioPlaybackState) => void;
  setPlaybackError: (value: string | null) => void;
  setCurrentTimeSeconds: (value: number) => void;
}): () => void {
  const handleLoadedMetadata = () => {
    if (Number.isFinite(input.audio.duration) && input.audio.duration > 0) {
      input.setResolvedDurationSeconds(input.audio.duration);
    }
  };
  const handleCanPlay = () => input.setPlaybackState(input.audio.paused ? "ready" : "playing");
  const handleTimeUpdate = () => {
    input.setCurrentTimeSeconds(input.audio.currentTime);
    input.onTimeUpdate?.(input.audio.currentTime);
  };
  const handlePlay = () => input.setPlaybackState("playing");
  const handlePause = () => input.setPlaybackState("ready");
  const handleEnded = () => {
    input.setCurrentTimeSeconds(Number.isFinite(input.audio.duration) ? input.audio.duration : 0);
    input.setPlaybackState("ready");
  };
  const handleError = () => {
    input.setPlaybackState("error");
    input.setPlaybackError(input.errorNote);
  };

  input.audio.addEventListener("loadedmetadata", handleLoadedMetadata);
  input.audio.addEventListener("canplay", handleCanPlay);
  input.audio.addEventListener("timeupdate", handleTimeUpdate);
  input.audio.addEventListener("play", handlePlay);
  input.audio.addEventListener("pause", handlePause);
  input.audio.addEventListener("ended", handleEnded);
  input.audio.addEventListener("error", handleError);

  return () => {
    input.audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    input.audio.removeEventListener("canplay", handleCanPlay);
    input.audio.removeEventListener("timeupdate", handleTimeUpdate);
    input.audio.removeEventListener("play", handlePlay);
    input.audio.removeEventListener("pause", handlePause);
    input.audio.removeEventListener("ended", handleEnded);
    input.audio.removeEventListener("error", handleError);
  };
}

export function loadManagedAudioBlobElement(input: {
  audio: Pick<ManagedAudioBlobElement, "pause" | "currentTime" | "volume" | "src" | "load">;
  url: string;
  volume: number;
}): void {
  input.audio.pause();
  input.audio.currentTime = 0;
  input.audio.volume = input.volume;
  input.audio.src = input.url;
  input.audio.load();
}
