import { useCallback, useRef, useState } from "react";

import type {
  MonitorLiveStreamControllerRefs,
  MonitorLiveStreamControllerSetters,
} from "./monitorLiveStreamControllerRuntime";
import { createMonitorLiveStreamSimulateLogHandler } from "./monitorLiveStreamControllerStateHookRuntime";
import { createMonitorSignalBuffer, type MonitorLogSignalPoint } from "./monitorLiveStreamRuntime";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { MonitorLogLine } from "./monitorLogParsing";
import { useMonitorLiveStreamStateRefs } from "./useMonitorLiveStreamStateRefs";

interface UseMonitorLiveStreamControllerStateInput {
  maxLiveLines: number;
}

export function useMonitorLiveStreamControllerState({
  maxLiveLines,
}: UseMonitorLiveStreamControllerStateInput) {
  const [liveLines, setLiveLines] = useState<MonitorLogLine[]>([]);
  const [logSignalBuffer, setLogSignalBuffer] = useState<MonitorLogSignalPoint[]>(
    createMonitorSignalBuffer(),
  );
  const [liveSuggestedBpm, setLiveSuggestedBpm] = useState<number | null>(null);
  const [waveformAnomalies, setWaveformAnomalies] = useState<WaveformAnomalyMarker[]>([]);
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);

  const audioProbePlayedRef = useRef(false);
  const lastCueAccentAtRef = useRef(0);
  const lastStreamEventAtRef = useRef<number>(Date.now());
  const {
    liveSuggestedBpmRef,
    liveLinesRef,
    logSignalBufferRef,
    waveformAnomaliesRef,
    selectedAnomalyIdRef,
  } = useMonitorLiveStreamStateRefs({
    liveSuggestedBpm,
    liveLines,
    logSignalBuffer,
    waveformAnomalies,
    selectedAnomalyId,
  });

  const refs: MonitorLiveStreamControllerRefs = {
    liveSuggestedBpmRef,
    liveLinesRef,
    logSignalBufferRef,
    waveformAnomaliesRef,
    selectedAnomalyIdRef,
    audioProbePlayedRef,
    lastCueAccentAtRef,
    lastStreamEventAtRef,
  };

  const setters: MonitorLiveStreamControllerSetters = {
    setLiveLines,
    setLogSignalBuffer,
    setLiveSuggestedBpm,
    setWaveformAnomalies,
    setSelectedAnomalyId,
  };

  const simulateLog = useCallback(() => {
    createMonitorLiveStreamSimulateLogHandler({
      refs: {
        liveLinesRef: refs.liveLinesRef,
        logSignalBufferRef: refs.logSignalBufferRef,
      },
      setLiveLines,
      setLogSignalBuffer,
      now: () => Date.now(),
      random: () => Math.random(),
      maxLiveLines,
    })();
  }, [maxLiveLines, refs.liveLinesRef, refs.logSignalBufferRef]);

  return {
    liveLines,
    logSignalBuffer,
    liveSuggestedBpm,
    waveformAnomalies,
    selectedAnomalyId,
    setSelectedAnomalyId,
    refs,
    setters,
    simulateLog,
  };
}
