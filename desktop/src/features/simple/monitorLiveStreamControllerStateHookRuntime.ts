import type {
  MonitorLiveStreamControllerRefs,
  MonitorLiveStreamControllerSetters,
} from "./monitorLiveStreamControllerRuntime";
import { simulateMonitorLiveStreamLogState } from "./monitorLiveStreamControllerRuntime";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamRuntime";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { MonitorLogLine } from "./monitorLogParsing";

export function buildMonitorLiveStreamControllerRefs(input: {
  liveSuggestedBpmRef: { current: number | null };
  liveLinesRef: { current: MonitorLogLine[] };
  logSignalBufferRef: { current: MonitorLogSignalPoint[] };
  waveformAnomaliesRef: { current: WaveformAnomalyMarker[] };
  selectedAnomalyIdRef: { current: string | null };
  audioProbePlayedRef: { current: boolean };
  lastCueAccentAtRef: { current: number };
  lastStreamEventAtRef: { current: number };
}): MonitorLiveStreamControllerRefs {
  return {
    liveSuggestedBpmRef: input.liveSuggestedBpmRef,
    liveLinesRef: input.liveLinesRef,
    logSignalBufferRef: input.logSignalBufferRef,
    waveformAnomaliesRef: input.waveformAnomaliesRef,
    selectedAnomalyIdRef: input.selectedAnomalyIdRef,
    audioProbePlayedRef: input.audioProbePlayedRef,
    lastCueAccentAtRef: input.lastCueAccentAtRef,
    lastStreamEventAtRef: input.lastStreamEventAtRef,
  };
}

export function buildMonitorLiveStreamControllerSetters(input: {
  setLiveLines: MonitorLiveStreamControllerSetters["setLiveLines"];
  setLogSignalBuffer: MonitorLiveStreamControllerSetters["setLogSignalBuffer"];
  setLiveSuggestedBpm: MonitorLiveStreamControllerSetters["setLiveSuggestedBpm"];
  setWaveformAnomalies: MonitorLiveStreamControllerSetters["setWaveformAnomalies"];
  setSelectedAnomalyId: MonitorLiveStreamControllerSetters["setSelectedAnomalyId"];
}): MonitorLiveStreamControllerSetters {
  return {
    setLiveLines: input.setLiveLines,
    setLogSignalBuffer: input.setLogSignalBuffer,
    setLiveSuggestedBpm: input.setLiveSuggestedBpm,
    setWaveformAnomalies: input.setWaveformAnomalies,
    setSelectedAnomalyId: input.setSelectedAnomalyId,
  };
}

export function createMonitorLiveStreamSimulateLogHandler(input: {
  refs: Pick<MonitorLiveStreamControllerRefs, "liveLinesRef" | "logSignalBufferRef">;
  setLiveLines: MonitorLiveStreamControllerSetters["setLiveLines"];
  setLogSignalBuffer: (
    value: MonitorLiveStreamControllerRefs["logSignalBufferRef"]["current"],
  ) => void;
  maxLiveLines: number;
  now: () => number;
  random: () => number;
}) {
  return () =>
    simulateMonitorLiveStreamLogState({
      nowMs: input.now(),
      previousLiveLines: input.refs.liveLinesRef.current,
      previousLogSignalBuffer: input.refs.logSignalBufferRef.current,
      setLiveLines: input.setLiveLines,
      setLogSignalBuffer: input.setLogSignalBuffer,
      refs: input.refs,
      randomValue: input.random(),
      maxLiveLines: input.maxLiveLines,
    });
}

export function buildMonitorLiveStreamControllerStateHookState(input: {
  liveLines: MonitorLogLine[];
  logSignalBuffer: MonitorLogSignalPoint[];
  liveSuggestedBpm: number | null;
  waveformAnomalies: WaveformAnomalyMarker[];
  selectedAnomalyId: string | null;
  setSelectedAnomalyId: (
    value: string | null | ((current: string | null) => string | null),
  ) => void;
  refs: MonitorLiveStreamControllerRefs;
  setters: MonitorLiveStreamControllerSetters;
  simulateLog: () => void;
}) {
  return {
    liveLines: input.liveLines,
    logSignalBuffer: input.logSignalBuffer,
    liveSuggestedBpm: input.liveSuggestedBpm,
    waveformAnomalies: input.waveformAnomalies,
    selectedAnomalyId: input.selectedAnomalyId,
    setSelectedAnomalyId: input.setSelectedAnomalyId,
    refs: input.refs,
    setters: input.setters,
    simulateLog: input.simulateLog,
  };
}
