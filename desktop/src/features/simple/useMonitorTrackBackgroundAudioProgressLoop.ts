import { useEffect } from "react";

import { readMonitorTrackAudioSnapshot } from "./monitorTrackAudioRuntime";
import {
  buildMonitorTrackProgressState,
  shouldStartMonitorProgressLoop,
} from "./monitorTrackAudioOrchestrationRuntime";

interface UseMonitorTrackBackgroundAudioProgressLoopInput {
  safeRuntime: boolean;
  isListening: boolean;
  backgroundAudioRef: { current: HTMLAudioElement | null };
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  setTrackDurationSeconds: (value: number | null) => void;
}

export function useMonitorTrackBackgroundAudioProgressLoop({
  safeRuntime,
  isListening,
  backgroundAudioRef,
  setTrackWaveProgress,
  setTrackElapsedSeconds,
  setTrackDurationSeconds,
}: UseMonitorTrackBackgroundAudioProgressLoopInput) {
  useEffect(() => {
    if (!shouldStartMonitorProgressLoop({ safeRuntime, isListening })) {
      setTrackWaveProgress(0);
      return;
    }

    let frameId = 0;
    const updateProgress = () => {
      const snapshot = readMonitorTrackAudioSnapshot(backgroundAudioRef.current);
      const progressState = buildMonitorTrackProgressState(snapshot);
      if (progressState) {
        setTrackWaveProgress(progressState.trackWaveProgress);
        setTrackElapsedSeconds(progressState.trackElapsedSeconds);
        setTrackDurationSeconds(progressState.trackDurationSeconds);
      }
      frameId = window.requestAnimationFrame(updateProgress);
    };

    frameId = window.requestAnimationFrame(updateProgress);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    backgroundAudioRef,
    isListening,
    safeRuntime,
    setTrackDurationSeconds,
    setTrackElapsedSeconds,
    setTrackWaveProgress,
  ]);
}
