import { isTauri } from "@tauri-apps/api/core";
import { useEffect } from "react";
import {
  cleanupManagedAudioBlobState,
  resetManagedAudioBlobState,
  resolveManagedAudioBlobAvailability,
} from "./managedAudioPlayerBlobLifecycleRuntime";
import { applyManagedAudioBlobAvailabilityState } from "./managedAudioPlayerBlobHookRuntime";
import { startManagedAudioBlobLoad } from "./managedAudioPlayerBlobLoadRuntime";
import type { UseManagedAudioPlayerBlobSourceInput } from "./useManagedAudioPlayerBlobSourceTypes";

export function useManagedAudioPlayerBlobSource(input: UseManagedAudioPlayerBlobSourceInput) {
  useEffect(() => {
    const audio = input.audioRef.current;
    resetManagedAudioBlobState({
      blobUrlRef: input.blobUrlRef,
      lastCueRequestIdRef: input.lastCueRequestIdRef,
      durationSeconds: input.durationSeconds,
      revokeObjectUrl: (url) => URL.revokeObjectURL(url),
      setters: {
        setBlobReady: input.setBlobReady,
        setPlaybackState: input.setPlaybackState,
        setPlaybackError: input.setPlaybackError,
        setCurrentTimeSeconds: input.setCurrentTimeSeconds,
        setResolvedDurationSeconds: input.setResolvedDurationSeconds,
      },
    });

    const availability = resolveManagedAudioBlobAvailability({
      audioPath: input.audioPath,
      audio,
      isDesktopRuntime: isTauri(),
    });

    if (
      !applyManagedAudioBlobAvailabilityState({
        availability,
        audio,
        setPlaybackState: input.setPlaybackState,
      })
    ) {
      return;
    }

    const audioPath = input.audioPath!;
    const playableAudio = audio!;
    let cancelled = false;
    let cleanupListeners: (() => void) | null = null;

    startManagedAudioBlobLoad({
      audioPath,
      audio: playableAudio,
      errorNote: input.errorNote,
      onTimeUpdate: input.onTimeUpdate,
      volume: input.volume,
      blobUrlRef: input.blobUrlRef,
      setBlobReady: input.setBlobReady,
      setPlaybackState: input.setPlaybackState,
      setPlaybackError: input.setPlaybackError,
      setCurrentTimeSeconds: input.setCurrentTimeSeconds,
      setResolvedDurationSeconds: input.setResolvedDurationSeconds,
      isCancelled: () => cancelled,
      setCleanupListeners: (nextCleanupListeners) => {
        cleanupListeners = nextCleanupListeners;
      },
    });

    return () => {
      cancelled = true;
      cleanupManagedAudioBlobState({
        audio,
        blobUrlRef: input.blobUrlRef,
        revokeObjectUrl: (url) => URL.revokeObjectURL(url),
        cleanupListeners,
      });
    };
  }, [
    input.audioPath,
    input.audioRef,
    input.blobUrlRef,
    input.durationSeconds,
    input.errorNote,
    input.lastCueRequestIdRef,
    input.onTimeUpdate,
    input.setBlobReady,
    input.setCurrentTimeSeconds,
    input.setPlaybackError,
    input.setPlaybackState,
    input.setResolvedDurationSeconds,
    input.volume,
  ]);
}
