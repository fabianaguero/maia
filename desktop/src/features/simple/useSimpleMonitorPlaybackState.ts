import { useEffect, useRef, useState } from "react";

interface UseSimpleMonitorPlaybackStateOptions {
  isListening: boolean;
}

export function useSimpleMonitorPlaybackState({
  isListening,
}: UseSimpleMonitorPlaybackStateOptions) {
  const [trackWaveProgress, setTrackWaveProgress] = useState(0);
  const [trackElapsedSeconds, setTrackElapsedSeconds] = useState(0);
  const [trackDurationSeconds, setTrackDurationSeconds] = useState<number | null>(null);
  const trackWaveProgressRef = useRef(trackWaveProgress);

  useEffect(() => {
    trackWaveProgressRef.current = trackWaveProgress;
  }, [trackWaveProgress]);

  useEffect(() => {
    try {
      if (!isListening) {
        setTrackElapsedSeconds(0);
        setTrackDurationSeconds(null);
        setTrackWaveProgress(0);
      }
    } catch (error) {
      console.error("[MAIA:UI] monitor reset effect failed", error);
    }
  }, [isListening]);

  return {
    trackWaveProgress,
    setTrackWaveProgress,
    trackElapsedSeconds,
    setTrackElapsedSeconds,
    trackDurationSeconds,
    setTrackDurationSeconds,
    trackWaveProgressRef,
  };
}
