import { useRef } from "react";

import type { LibraryTrack } from "../../types/library";
import { useMonitorTrackBackgroundAudioBinding } from "./useMonitorTrackBackgroundAudioBinding";
import { useMonitorTrackBackgroundAudioProgressLoop } from "./useMonitorTrackBackgroundAudioProgressLoop";
import { useMonitorTrackBackgroundAudioReset } from "./useMonitorTrackBackgroundAudioReset";

interface UseMonitorTrackBackgroundAudioInput {
  audioContext: AudioContext | null;
  isListening: boolean;
  safeRuntime: boolean;
  activeTrack: LibraryTrack | null;
  ensureBackgroundGraph: (audio: HTMLAudioElement, context: AudioContext) => unknown;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  setTrackDurationSeconds: (value: number | null) => void;
  revokePreviewUrl: (url: string | null | undefined) => void;
}

export function useMonitorTrackBackgroundAudio({
  audioContext,
  isListening,
  safeRuntime,
  activeTrack,
  ensureBackgroundGraph,
  setTrackWaveProgress,
  setTrackElapsedSeconds,
  setTrackDurationSeconds,
  revokePreviewUrl,
}: UseMonitorTrackBackgroundAudioInput) {
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const backgroundAudioUrlRef = useRef<string | null>(null);
  const backgroundAudioPathRef = useRef<string | null>(null);

  useMonitorTrackBackgroundAudioReset({
    isListening,
    backgroundAudioRef,
    backgroundAudioUrlRef,
    backgroundAudioPathRef,
    revokePreviewUrl,
    setTrackWaveProgress,
    setTrackElapsedSeconds,
    setTrackDurationSeconds,
  });

  useMonitorTrackBackgroundAudioProgressLoop({
    safeRuntime,
    isListening,
    backgroundAudioRef,
    setTrackWaveProgress,
    setTrackElapsedSeconds,
    setTrackDurationSeconds,
  });

  useMonitorTrackBackgroundAudioBinding({
    audioContext,
    isListening,
    safeRuntime,
    activeTrack,
    backgroundAudioRef,
    backgroundAudioUrlRef,
    backgroundAudioPathRef,
    ensureBackgroundGraph,
    revokePreviewUrl,
  });

  return {
    backgroundAudioRef,
  };
}
