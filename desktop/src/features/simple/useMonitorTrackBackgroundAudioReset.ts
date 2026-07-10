import { useEffect } from "react";

import { stopMonitorAudio } from "./monitorTrackAudioRuntime";
import { buildMonitorTrackAudioResetState } from "./monitorTrackAudioOrchestrationRuntime";

interface UseMonitorTrackBackgroundAudioResetInput {
  isListening: boolean;
  backgroundAudioRef: { current: HTMLAudioElement | null };
  backgroundAudioUrlRef: { current: string | null };
  backgroundAudioPathRef: { current: string | null };
  revokePreviewUrl: (url: string | null | undefined) => void;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  setTrackDurationSeconds: (value: number | null) => void;
}

export function useMonitorTrackBackgroundAudioReset({
  isListening,
  backgroundAudioRef,
  backgroundAudioUrlRef,
  backgroundAudioPathRef,
  revokePreviewUrl,
  setTrackWaveProgress,
  setTrackElapsedSeconds,
  setTrackDurationSeconds,
}: UseMonitorTrackBackgroundAudioResetInput) {
  useEffect(() => {
    if (!isListening) {
      const resetState = buildMonitorTrackAudioResetState();
      const audio = backgroundAudioRef.current;
      if (audio) {
        stopMonitorAudio(audio);
      }
      if (resetState.clearBackgroundAudio) {
        backgroundAudioRef.current = null;
      }
      if (resetState.clearBackgroundUrl) {
        revokePreviewUrl(backgroundAudioUrlRef.current);
        backgroundAudioUrlRef.current = null;
        backgroundAudioPathRef.current = null;
      }
      setTrackWaveProgress(resetState.trackWaveProgress);
      setTrackElapsedSeconds(resetState.trackElapsedSeconds);
      setTrackDurationSeconds(resetState.trackDurationSeconds);
    }
  }, [
    backgroundAudioRef,
    backgroundAudioPathRef,
    backgroundAudioUrlRef,
    isListening,
    revokePreviewUrl,
    setTrackDurationSeconds,
    setTrackElapsedSeconds,
    setTrackWaveProgress,
  ]);
}
