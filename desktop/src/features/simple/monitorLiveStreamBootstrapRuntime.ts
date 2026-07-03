import { getBasename } from "./monitorDisplay";
import type { MonitorLogLine } from "./monitorLogParsing";
import { createMonitorSignalBuffer } from "./monitorLiveStreamSignalRuntime";
import type { MonitorLiveStreamHookState } from "./monitorLiveStreamStateTypes";

export function buildMonitorBootstrapLine(input: {
  sessionSourcePath?: string;
  streamAdapterLabel: string;
  now?: Date;
}): MonitorLogLine {
  const currentDate = input.now ?? new Date();

  return {
    id: "maia-monitor-init",
    timestamp: currentDate.toLocaleTimeString().split(" ")[0],
    level: "info",
    message: `MAIA_MONITOR_INITIALIZED: ${input.streamAdapterLabel} armed. Listening to ${getBasename(input.sessionSourcePath)}...`,
    isAnomaly: false,
    anomalyId: null,
  };
}

export function buildMonitorLiveStreamResetState(): Pick<
  MonitorLiveStreamHookState,
  "liveLines" | "logSignalBuffer" | "liveSuggestedBpm" | "waveformAnomalies" | "selectedAnomalyId"
> {
  return {
    liveLines: [],
    logSignalBuffer: createMonitorSignalBuffer(),
    liveSuggestedBpm: null,
    waveformAnomalies: [],
    selectedAnomalyId: null,
  };
}

export function buildMonitorLiveStreamHookState(
  input: MonitorLiveStreamHookState,
): MonitorLiveStreamHookState {
  return {
    liveLines: input.liveLines,
    logSignalBuffer: input.logSignalBuffer,
    liveSuggestedBpm: input.liveSuggestedBpm,
    waveformAnomalies: input.waveformAnomalies,
    selectedAnomalyId: input.selectedAnomalyId,
    setSelectedAnomalyId: input.setSelectedAnomalyId,
    simulateLog: input.simulateLog,
  };
}
