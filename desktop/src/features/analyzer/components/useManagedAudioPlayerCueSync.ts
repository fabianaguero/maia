import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import {
  resolveManagedAudioCueError,
  resolveManagedAudioCueTargetSecond,
  type ManagedAudioPlaybackState,
} from "./managedAudioPlayerRuntime";
import type { ManagedAudioCueRequest } from "./ManagedAudioPlayer";

interface UseManagedAudioPlayerCueSyncInput {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  lastCueRequestIdRef: MutableRefObject<number | null>;
  blobReady: boolean;
  cueRequest?: ManagedAudioCueRequest | null;
  durationSeconds: number | null;
  resolvedDurationSeconds: number;
  playbackState: ManagedAudioPlaybackState;
  onTimeUpdate?: (seconds: number) => void;
  setPlaybackState: Dispatch<SetStateAction<ManagedAudioPlaybackState>>;
  setPlaybackError: Dispatch<SetStateAction<string | null>>;
  setCurrentTimeSeconds: Dispatch<SetStateAction<number>>;
}

export function useManagedAudioPlayerCueSync(input: UseManagedAudioPlayerCueSyncInput) {
  const {
    audioRef,
    lastCueRequestIdRef,
    blobReady,
    cueRequest,
    durationSeconds,
    resolvedDurationSeconds,
    playbackState,
    onTimeUpdate,
    setPlaybackState,
    setPlaybackError,
    setCurrentTimeSeconds,
  } = input;

  useEffect(() => {
    const audio = audioRef.current;
    if (!cueRequest || !audio || !blobReady) {
      return;
    }

    if (lastCueRequestIdRef.current === cueRequest.id) {
      return;
    }

    lastCueRequestIdRef.current = cueRequest.id;

    const targetSecond = resolveManagedAudioCueTargetSecond({
      cueSecond: cueRequest.second,
      resolvedDurationSeconds,
      durationSeconds,
    });

    setPlaybackError(null);
    setCurrentTimeSeconds(targetSecond);
    onTimeUpdate?.(targetSecond);
    audio.currentTime = targetSecond;

    if (!cueRequest.autoplay) {
      if (audio.paused && playbackState !== "error") {
        setPlaybackState("ready");
      }
      return;
    }

    setPlaybackState("loading");
    void audio.play().catch((error) => {
      setPlaybackState("error");
      setPlaybackError(resolveManagedAudioCueError(error));
    });
  }, [
    audioRef,
    blobReady,
    cueRequest,
    durationSeconds,
    lastCueRequestIdRef,
    onTimeUpdate,
    playbackState,
    resolvedDurationSeconds,
    setCurrentTimeSeconds,
    setPlaybackError,
    setPlaybackState,
  ]);
}
