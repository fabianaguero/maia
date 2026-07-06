import {
  buildMonitorBootstrapLine,
  buildMonitorLiveStreamResetState,
} from "./monitorLiveStreamRuntime";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamRuntime";
import type { MonitorLogLine } from "./monitorLogParsing";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";

export interface MonitorLiveStreamLifecycleRefs {
  liveLinesRef: { current: MonitorLogLine[] };
  logSignalBufferRef: { current: MonitorLogSignalPoint[] };
  waveformAnomaliesRef: { current: WaveformAnomalyMarker[] };
  selectedAnomalyIdRef: { current: string | null };
  lastStreamEventAtRef: { current: number };
  audioProbePlayedRef: { current: boolean };
}

export interface MonitorLiveStreamLifecycleSetters {
  setLiveLines: (value: MonitorLogLine[]) => void;
  setLogSignalBuffer: (value: MonitorLogSignalPoint[]) => void;
  setLiveSuggestedBpm: (value: number | null) => void;
  setWaveformAnomalies: (value: WaveformAnomalyMarker[]) => void;
  setSelectedAnomalyId: (value: string | null) => void;
}

export function applyMonitorLiveStreamLifecycleState(input: {
  isListening: boolean;
  sessionSourcePath?: string;
  streamAdapterLabel: string;
  refs: MonitorLiveStreamLifecycleRefs;
  setters: MonitorLiveStreamLifecycleSetters;
  nowMs: number;
  nowDate?: Date;
}): void {
  if (input.isListening) {
    input.refs.lastStreamEventAtRef.current = input.nowMs;
    const bootstrapLine = buildMonitorBootstrapLine({
      sessionSourcePath: input.sessionSourcePath,
      streamAdapterLabel: input.streamAdapterLabel,
      now: input.nowDate,
    });
    input.refs.liveLinesRef.current = [bootstrapLine];
    input.setters.setLiveLines(input.refs.liveLinesRef.current);
    return;
  }

  const resetState = buildMonitorLiveStreamResetState();
  input.refs.liveLinesRef.current = resetState.liveLines;
  input.refs.logSignalBufferRef.current = resetState.logSignalBuffer;
  input.refs.waveformAnomaliesRef.current = resetState.waveformAnomalies;
  input.refs.selectedAnomalyIdRef.current = resetState.selectedAnomalyId;
  input.refs.audioProbePlayedRef.current = false;
  input.refs.lastStreamEventAtRef.current = input.nowMs;

  input.setters.setLiveLines(resetState.liveLines);
  input.setters.setLogSignalBuffer(resetState.logSignalBuffer);
  input.setters.setLiveSuggestedBpm(resetState.liveSuggestedBpm);
  input.setters.setWaveformAnomalies(resetState.waveformAnomalies);
  input.setters.setSelectedAnomalyId(resetState.selectedAnomalyId);
}
