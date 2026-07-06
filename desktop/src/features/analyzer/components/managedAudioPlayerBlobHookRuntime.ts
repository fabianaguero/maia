import { invokeOrFallback } from "../../../api/tauri";
import type { ManagedAudioPlaybackState } from "./managedAudioPlayerRuntime";

type SetPlaybackState = (value: ManagedAudioPlaybackState) => void;

export function applyManagedAudioBlobAvailabilityState(input: {
  availability: "idle" | "unavailable" | "loadable";
  audio: HTMLAudioElement | null;
  setPlaybackState: SetPlaybackState;
}): boolean {
  if (input.availability === "idle") {
    input.setPlaybackState("idle");
    if (input.audio) {
      input.audio.pause();
      input.audio.src = "";
    }
    return false;
  }

  if (input.availability === "unavailable") {
    input.setPlaybackState("unavailable");
    return false;
  }

  input.setPlaybackState("loading");
  return true;
}

export function readManagedAudioBlobBytes(audioPath: string): Promise<string> {
  return invokeOrFallback<string>("read_audio_bytes", { path: audioPath }, () =>
    Promise.reject(new Error("Audio playback not available: desktop shell required")),
  );
}
