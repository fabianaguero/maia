import { useEffect } from "react";

import type { MonitorDeckControls } from "./monitorDeckControls";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamRuntime";
import { buildMonitorLiveStreamIdleMotionTickState } from "./monitorLiveStreamIdleMotionControllerRuntime";

interface UseMonitorLiveStreamIdleMotionInput {
  isListening: boolean;
  idleHoldMs: number;
  trackBpm: number | null;
  deckControlsRef: { current: MonitorDeckControls };
  liveSuggestedBpmRef: { current: number | null };
  logSignalBufferRef: { current: MonitorLogSignalPoint[] };
  lastStreamEventAtRef: { current: number };
  setLogSignalBuffer: (
    value:
      | MonitorLogSignalPoint[]
      | ((previous: MonitorLogSignalPoint[]) => MonitorLogSignalPoint[]),
  ) => void;
}

export function useMonitorLiveStreamIdleMotion({
  isListening,
  idleHoldMs,
  trackBpm,
  deckControlsRef,
  liveSuggestedBpmRef,
  logSignalBufferRef,
  lastStreamEventAtRef,
  setLogSignalBuffer,
}: UseMonitorLiveStreamIdleMotionInput): void {
  useEffect(() => {
    if (!isListening) {
      return;
    }

    const timer = window.setInterval(() => {
      const now = Date.now();
      const controls = deckControlsRef.current;

      setLogSignalBuffer((prev) => {
        const nextBuffer = buildMonitorLiveStreamIdleMotionTickState({
          previous: prev,
          nowMs: now,
          lastStreamEventAtMs: lastStreamEventAtRef.current,
          idleHoldMs,
          controls,
          liveSuggestedBpm: liveSuggestedBpmRef.current,
          trackBpm,
        });
        if (!nextBuffer) {
          return prev;
        }
        logSignalBufferRef.current = nextBuffer;
        return nextBuffer;
      });
    }, 650);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    deckControlsRef,
    idleHoldMs,
    isListening,
    lastStreamEventAtRef,
    liveSuggestedBpmRef,
    logSignalBufferRef,
    setLogSignalBuffer,
    trackBpm,
  ]);
}
