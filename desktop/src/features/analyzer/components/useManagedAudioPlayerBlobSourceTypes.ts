import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { ManagedAudioPlaybackState } from "./managedAudioPlayerRuntime";

export interface UseManagedAudioPlayerBlobSourceInput {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  blobUrlRef: MutableRefObject<string | null>;
  lastCueRequestIdRef: MutableRefObject<number | null>;
  audioPath: string | null;
  durationSeconds: number | null;
  errorNote: string;
  onTimeUpdate?: (seconds: number) => void;
  volume: number;
  setBlobReady: Dispatch<SetStateAction<boolean>>;
  setPlaybackState: Dispatch<SetStateAction<ManagedAudioPlaybackState>>;
  setPlaybackError: Dispatch<SetStateAction<string | null>>;
  setCurrentTimeSeconds: Dispatch<SetStateAction<number>>;
  setResolvedDurationSeconds: Dispatch<SetStateAction<number>>;
}
