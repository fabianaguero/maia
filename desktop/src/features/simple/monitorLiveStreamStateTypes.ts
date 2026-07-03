import type { LiveLogCue, LiveLogMarker } from "../../types/monitor";
import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import type { MonitorLogLine } from "./monitorLogParsing";
import type { MonitorLogSignalPoint } from "./monitorLiveStreamSignalRuntime";

export interface SanitizedLiveLogStreamUpdate {
  parsedLines: string[];
  cueBatch: LiveLogCue[];
  anomalyMarkers: LiveLogMarker[];
  hasRealLines: boolean;
  hasRealSignals: boolean;
  hasMeaningfulUpdate: boolean;
  suggestedBpm: number | null;
}

export interface MonitorLiveStreamHookState {
  liveLines: MonitorLogLine[];
  logSignalBuffer: MonitorLogSignalPoint[];
  liveSuggestedBpm: number | null;
  waveformAnomalies: WaveformAnomalyMarker[];
  selectedAnomalyId: string | null;
  setSelectedAnomalyId: (
    value: string | null | ((current: string | null) => string | null),
  ) => void;
  simulateLog: () => void;
}

export interface MonitorWaveContextSnapshot {
  durationSeconds: number | null;
  currentProgress: number;
  bpm: number | null;
}
