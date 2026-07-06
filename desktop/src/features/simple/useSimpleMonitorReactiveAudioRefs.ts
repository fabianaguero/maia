import { useEffect, useRef } from "react";

import type { MonitorDeckControls } from "./monitorDeckControls";
import type { BackgroundTrackGraph } from "./simpleMonitorReactiveAudioRuntime";

interface UseSimpleMonitorReactiveAudioRefsInput {
  audioContext: AudioContext | null;
  isListening: boolean;
  deckControls: MonitorDeckControls;
}

export function useSimpleMonitorReactiveAudioRefs({
  audioContext,
  isListening,
  deckControls,
}: UseSimpleMonitorReactiveAudioRefsInput) {
  const backgroundGraphRef = useRef<BackgroundTrackGraph | null>(null);
  const audioContextRef = useRef<AudioContext | null>(audioContext);
  const deckControlsRef = useRef<MonitorDeckControls>(deckControls);
  const smoothedPressureRef = useRef(0);

  useEffect(() => {
    audioContextRef.current = audioContext;
  }, [audioContext]);

  useEffect(() => {
    deckControlsRef.current = deckControls;
  }, [deckControls]);

  useEffect(() => {
    if (!isListening) {
      smoothedPressureRef.current = 0;
      backgroundGraphRef.current = null;
    }
  }, [isListening]);

  return {
    backgroundGraphRef,
    audioContextRef,
    deckControlsRef,
    smoothedPressureRef,
  };
}
