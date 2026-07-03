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
  useEffect(() => {
    const audio = input.audioRef.current;
    if (!input.cueRequest || !audio || !input.blobReady) {
      return;
    }

    if (input.lastCueRequestIdRef.current === input.cueRequest.id) {
      return;
    }

    input.lastCueRequestIdRef.current = input.cueRequest.id;

    const targetSecond = resolveManagedAudioCueTargetSecond({
      cueSecond: input.cueRequest.second,
      resolvedDurationSeconds: input.resolvedDurationSeconds,
      durationSeconds: input.durationSeconds,
    });

    input.setPlaybackError(null);
    input.setCurrentTimeSeconds(targetSecond);
    input.onTimeUpdate?.(targetSecond);
    audio.currentTime = targetSecond;

    if (!input.cueRequest.autoplay) {
      if (audio.paused && input.playbackState !== "error") {
        input.setPlaybackState("ready");
      }
      return;
    }

    input.setPlaybackState("loading");
    void audio.play().catch((error) => {
      input.setPlaybackState("error");
      input.setPlaybackError(resolveManagedAudioCueError(error));
    });
  }, [
    input.audioRef,
    input.blobReady,
    input.cueRequest,
    input.durationSeconds,
    input.lastCueRequestIdRef,
    input.onTimeUpdate,
    input.playbackState,
    input.resolvedDurationSeconds,
    input.setCurrentTimeSeconds,
    input.setPlaybackError,
    input.setPlaybackState,
  ]);
}
