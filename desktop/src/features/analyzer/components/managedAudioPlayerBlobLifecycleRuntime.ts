import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import {
  canManagedAudioAttemptPlayback,
  type ManagedAudioPlaybackState,
} from "./managedAudioPlayerRuntime";

interface ManagedAudioBlobStateSetters {
  setBlobReady: Dispatch<SetStateAction<boolean>>;
  setPlaybackState: Dispatch<SetStateAction<ManagedAudioPlaybackState>>;
  setPlaybackError: Dispatch<SetStateAction<string | null>>;
  setCurrentTimeSeconds: Dispatch<SetStateAction<number>>;
  setResolvedDurationSeconds: Dispatch<SetStateAction<number>>;
}

export function resetManagedAudioBlobState(input: {
  blobUrlRef: MutableRefObject<string | null>;
  lastCueRequestIdRef: MutableRefObject<number | null>;
  durationSeconds: number | null;
  revokeObjectUrl: (url: string) => void;
  setters: ManagedAudioBlobStateSetters;
}): void {
  input.setters.setPlaybackError(null);
  input.setters.setCurrentTimeSeconds(0);
  input.setters.setBlobReady(false);
  input.setters.setResolvedDurationSeconds(input.durationSeconds ?? 0);
  input.lastCueRequestIdRef.current = null;

  if (input.blobUrlRef.current) {
    input.revokeObjectUrl(input.blobUrlRef.current);
    input.blobUrlRef.current = null;
  }
}

export function resolveManagedAudioBlobAvailability(input: {
  audioPath: string | null;
  audio: HTMLAudioElement | null;
  isDesktopRuntime: boolean;
}): "idle" | "unavailable" | "loadable" {
  if (!input.audioPath) {
    return "idle";
  }

  if (!canManagedAudioAttemptPlayback(input.audioPath, input.isDesktopRuntime) || !input.audio) {
    return "unavailable";
  }

  return "loadable";
}

export function cleanupManagedAudioBlobState(input: {
  audio: HTMLAudioElement | null;
  blobUrlRef: MutableRefObject<string | null>;
  revokeObjectUrl: (url: string) => void;
  cleanupListeners?: (() => void) | null;
}): void {
  input.cleanupListeners?.();
  if (input.audio) {
    input.audio.pause();
    input.audio.src = "";
  }
  if (input.blobUrlRef.current) {
    input.revokeObjectUrl(input.blobUrlRef.current);
    input.blobUrlRef.current = null;
  }
}
