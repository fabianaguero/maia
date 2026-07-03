import { useEffect, useRef } from "react";

import type { MonitorLogLine } from "./monitorLogParsing";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamRuntime";

interface UseMonitorLiveStreamStateRefsInput {
  liveSuggestedBpm: number | null;
  liveLines: MonitorLogLine[];
  logSignalBuffer: MonitorLogSignalPoint[];
  waveformAnomalies: WaveformAnomalyMarker[];
  selectedAnomalyId: string | null;
}

export function useMonitorLiveStreamStateRefs({
  liveSuggestedBpm,
  liveLines,
  logSignalBuffer,
  waveformAnomalies,
  selectedAnomalyId,
}: UseMonitorLiveStreamStateRefsInput) {
  const liveSuggestedBpmRef = useRef<number | null>(null);
  const liveLinesRef = useRef<MonitorLogLine[]>([]);
  const logSignalBufferRef = useRef<MonitorLogSignalPoint[]>(logSignalBuffer);
  const waveformAnomaliesRef = useRef<WaveformAnomalyMarker[]>([]);
  const selectedAnomalyIdRef = useRef<string | null>(null);

  useEffect(() => {
    liveSuggestedBpmRef.current = liveSuggestedBpm;
  }, [liveSuggestedBpm]);

  useEffect(() => {
    liveLinesRef.current = liveLines;
  }, [liveLines]);

  useEffect(() => {
    logSignalBufferRef.current = logSignalBuffer;
  }, [logSignalBuffer]);

  useEffect(() => {
    waveformAnomaliesRef.current = waveformAnomalies;
  }, [waveformAnomalies]);

  useEffect(() => {
    selectedAnomalyIdRef.current = selectedAnomalyId;
  }, [selectedAnomalyId]);

  return {
    liveSuggestedBpmRef,
    liveLinesRef,
    logSignalBufferRef,
    waveformAnomaliesRef,
    selectedAnomalyIdRef,
  };
}
