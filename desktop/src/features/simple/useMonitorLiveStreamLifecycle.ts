import { useEffect } from "react";

import { applyMonitorLiveStreamLifecycleState } from "./monitorLiveStreamLifecycleControllerRuntime";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamRuntime";
import type { MonitorLogLine } from "./monitorLogParsing";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";

interface UseMonitorLiveStreamLifecycleInput {
  isListening: boolean;
  sessionSourcePath?: string;
  streamAdapterLabel: string;
  liveLinesRef: { current: MonitorLogLine[] };
  logSignalBufferRef: { current: MonitorLogSignalPoint[] };
  waveformAnomaliesRef: { current: WaveformAnomalyMarker[] };
  selectedAnomalyIdRef: { current: string | null };
  lastStreamEventAtRef: { current: number };
  audioProbePlayedRef: { current: boolean };
  setLiveLines: (value: MonitorLogLine[]) => void;
  setLogSignalBuffer: (value: MonitorLogSignalPoint[]) => void;
  setLiveSuggestedBpm: (value: number | null) => void;
  setWaveformAnomalies: (value: WaveformAnomalyMarker[]) => void;
  setSelectedAnomalyId: (value: string | null) => void;
}

export function useMonitorLiveStreamLifecycle({
  isListening,
  sessionSourcePath,
  streamAdapterLabel,
  liveLinesRef,
  logSignalBufferRef,
  waveformAnomaliesRef,
  selectedAnomalyIdRef,
  lastStreamEventAtRef,
  audioProbePlayedRef,
  setLiveLines,
  setLogSignalBuffer,
  setLiveSuggestedBpm,
  setWaveformAnomalies,
  setSelectedAnomalyId,
}: UseMonitorLiveStreamLifecycleInput): void {
  useEffect(() => {
    try {
      applyMonitorLiveStreamLifecycleState({
        isListening,
        sessionSourcePath,
        streamAdapterLabel,
        refs: {
          liveLinesRef,
          logSignalBufferRef,
          waveformAnomaliesRef,
          selectedAnomalyIdRef,
          lastStreamEventAtRef,
          audioProbePlayedRef,
        },
        setters: {
          setLiveLines,
          setLogSignalBuffer,
          setLiveSuggestedBpm,
          setWaveformAnomalies,
          setSelectedAnomalyId,
        },
        nowMs: Date.now(),
      });
    } catch (error) {
      console.error("[MAIA:UI] live stream state reset failed", error);
    }
  }, [
    audioProbePlayedRef,
    isListening,
    lastStreamEventAtRef,
    liveLinesRef,
    logSignalBufferRef,
    selectedAnomalyIdRef,
    sessionSourcePath,
    setLiveLines,
    setLogSignalBuffer,
    setLiveSuggestedBpm,
    setSelectedAnomalyId,
    setWaveformAnomalies,
    streamAdapterLabel,
    waveformAnomaliesRef,
  ]);
}
