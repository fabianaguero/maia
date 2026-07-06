import {
  applyManagedAudioBlobLoadFailure,
  loadManagedAudioBlobEffectState,
} from "./managedAudioPlayerBlobEffectRuntime";
import { readManagedAudioBlobBytes } from "./managedAudioPlayerBlobHookRuntime";
import type { UseManagedAudioPlayerBlobSourceInput } from "./useManagedAudioPlayerBlobSourceTypes";

export function startManagedAudioBlobLoad(
  input: Pick<
    UseManagedAudioPlayerBlobSourceInput,
    | "blobUrlRef"
    | "blobUrlRef"
    | "errorNote"
    | "onTimeUpdate"
    | "volume"
    | "setBlobReady"
    | "setPlaybackState"
    | "setPlaybackError"
    | "setCurrentTimeSeconds"
    | "setResolvedDurationSeconds"
  > & {
    audioPath: string;
    audio: HTMLAudioElement;
    isCancelled: () => boolean;
    setCleanupListeners: (cleanup: (() => void) | null) => void;
    createObjectUrl?: (blob: Blob) => string;
    readAudioBytes?: (audioPath: string) => Promise<string>;
  },
): void {
  const loadPromise = (input.readAudioBytes ?? readManagedAudioBlobBytes)(input.audioPath);

  loadPromise
    .then(async () => {
      if (input.isCancelled()) {
        return;
      }

      const cleanupListeners = await loadManagedAudioBlobEffectState({
        audioPath: input.audioPath,
        audio: input.audio,
        errorNote: input.errorNote,
        onTimeUpdate: input.onTimeUpdate,
        volume: input.volume,
        blobUrlRef: input.blobUrlRef,
        setBlobReady: input.setBlobReady,
        setPlaybackState: input.setPlaybackState,
        setPlaybackError: input.setPlaybackError,
        setCurrentTimeSeconds: input.setCurrentTimeSeconds,
        setResolvedDurationSeconds: input.setResolvedDurationSeconds,
        readAudioBytes: () => loadPromise,
        createObjectUrl: input.createObjectUrl ?? ((blob) => URL.createObjectURL(blob)),
      });

      if (input.isCancelled()) {
        cleanupListeners();
        return;
      }

      input.setCleanupListeners(cleanupListeners);
    })
    .catch((error) => {
      if (input.isCancelled()) {
        return;
      }

      applyManagedAudioBlobLoadFailure({
        error,
        setPlaybackState: input.setPlaybackState,
        setPlaybackError: input.setPlaybackError,
      });
    });
}
