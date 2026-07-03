import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import {
  resolveManagedAudioLoadError,
  type ManagedAudioPlaybackState,
} from "./managedAudioPlayerRuntime";
import {
  bindManagedAudioBlobElement,
  createManagedAudioBlobUrl,
  loadManagedAudioBlobElement,
} from "./managedAudioPlayerBlobSourceRuntime";

type SetBooleanState = Dispatch<SetStateAction<boolean>>;
type SetPlaybackState = Dispatch<SetStateAction<ManagedAudioPlaybackState>>;
type SetNullableStringState = Dispatch<SetStateAction<string | null>>;
type SetNumberState = Dispatch<SetStateAction<number>>;

export async function loadManagedAudioBlobEffectState(input: {
  audioPath: string;
  audio: HTMLAudioElement;
  errorNote: string;
  onTimeUpdate?: (seconds: number) => void;
  volume: number;
  blobUrlRef: MutableRefObject<string | null>;
  setBlobReady: SetBooleanState;
  setPlaybackState: SetPlaybackState;
  setPlaybackError: SetNullableStringState;
  setCurrentTimeSeconds: SetNumberState;
  setResolvedDurationSeconds: SetNumberState;
  readAudioBytes: () => Promise<string>;
  createObjectUrl: (blob: Blob) => string;
}): Promise<() => void> {
  const base64 = await input.readAudioBytes();
  const url = createManagedAudioBlobUrl({
    audioPath: input.audioPath,
    base64,
    createObjectUrl: input.createObjectUrl,
  });
  input.blobUrlRef.current = url;

  const cleanupListeners = bindManagedAudioBlobElement({
    audio: input.audio,
    errorNote: input.errorNote,
    onTimeUpdate: input.onTimeUpdate,
    setResolvedDurationSeconds: input.setResolvedDurationSeconds,
    setPlaybackState: input.setPlaybackState,
    setPlaybackError: input.setPlaybackError,
    setCurrentTimeSeconds: input.setCurrentTimeSeconds,
  });

  loadManagedAudioBlobElement({
    audio: input.audio,
    url,
    volume: input.volume,
  });
  input.setBlobReady(true);
  return cleanupListeners;
}

export function applyManagedAudioBlobLoadFailure(input: {
  error: unknown;
  setPlaybackState: SetPlaybackState;
  setPlaybackError: SetNullableStringState;
}): void {
  input.setPlaybackState("error");
  input.setPlaybackError(resolveManagedAudioLoadError(input.error));
}
