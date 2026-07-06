import type { LiveLogMarker, LiveLogStreamUpdate } from "../../../types/library";
import {
  resolveAnomalySourceRows,
  type AnomalySourceRow,
  type SyncTailRow,
} from "./liveLogMonitorPanelRuntime";
import type {
  AudioEngineStatus,
  LiveMonitorDisplayLabels,
  LiveMonitorDisplayState,
} from "./liveLogMonitorDisplayRuntime";

export function resolveAudioStateLabel(input: {
  status: AudioEngineStatus;
  liveEnabled: boolean;
  labels: Pick<
    LiveMonitorDisplayLabels,
    "audioUnavailable" | "audioError" | "audioActive" | "audioArmed" | "audioIdle"
  >;
}): string {
  if (input.status === "unsupported") {
    return input.labels.audioUnavailable;
  }
  if (input.status === "error") {
    return input.labels.audioError;
  }
  if (input.liveEnabled && input.status === "ready") {
    return input.labels.audioActive;
  }
  if (input.status === "ready") {
    return input.labels.audioArmed;
  }
  return input.labels.audioIdle;
}

export function buildLiveMonitorDisplayState(input: {
  lastUpdate: LiveLogStreamUpdate | null;
  recentMarkers: LiveLogMarker[];
  syncTailRows: SyncTailRow[];
  maxSyncTailLines: number;
  maxAnomalySourceLines: number;
  replayActive: boolean;
  liveEnabled: boolean;
  repositorySourcePath: string;
  audioStatus: AudioEngineStatus;
  labels: Pick<
    LiveMonitorDisplayLabels,
    | "replayLabel"
    | "liveLabel"
    | "stoppedLabel"
    | "audioUnavailable"
    | "audioError"
    | "audioActive"
    | "audioArmed"
    | "audioIdle"
    | "audioOn"
    | "audioBlocked"
  >;
}): LiveMonitorDisplayState {
  const currentLevelCounts = input.lastUpdate?.levelCounts ?? {};
  const anomalySourceRows = resolveAnomalySourceRows(input.lastUpdate, input.maxAnomalySourceLines);
  const waveAnomalyMarkers = input.recentMarkers.slice(0, 4);
  const liveSourceLabel = input.lastUpdate?.sourcePath ?? input.repositorySourcePath;
  const recentSyncTailRows = input.syncTailRows.slice(-input.maxSyncTailLines);
  const deckStatusLabel = input.replayActive
    ? input.labels.replayLabel
    : input.liveEnabled
      ? input.labels.liveLabel
      : input.labels.stoppedLabel;
  const audioStateLabel = resolveAudioStateLabel({
    status: input.audioStatus,
    liveEnabled: input.liveEnabled,
    labels: input.labels,
  });

  return {
    currentLevelCounts,
    anomalySourceRows,
    waveAnomalyMarkers,
    liveSourceLabel,
    recentSyncTailRows,
    deckStatusLabel,
    audioStateLabel,
    audioBadgeLabel:
      input.audioStatus === "ready" ? input.labels.audioOn : input.labels.audioBlocked,
    audioBadgeTone: input.audioStatus === "ready" ? "ready" : "warn",
  };
}

export type { AnomalySourceRow, SyncTailRow };
