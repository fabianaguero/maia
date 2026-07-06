import type { LiveLogMarker } from "../../../types/library";
import type { AnomalySourceRow, SyncTailRow } from "./liveLogMonitorDisplayStateRuntime";

export interface LiveMonitorDisplayLabels {
  replayLabel: string;
  liveLabel: string;
  stoppedLabel: string;
  audioUnavailable: string;
  audioError: string;
  audioActive: string;
  audioArmed: string;
  audioIdle: string;
  audioOn: string;
  audioBlocked: string;
  cueEngineBaseSamplePack: string;
  cueEngineBaseSample: string;
  cueEngineLoadingSample: string;
  cueEngineInternalSynth: string;
  replaySessionTitle: string;
  sessionTitle: string;
  storedSourceReplay: string;
  fallbackDirectFilePoll: string;
  replayComplete: string;
  windowsReplayed: string;
  modeLabel: string;
  audioEngineLabel: string;
  styleProfileTitle: string;
  mutationProfileTitle: string;
  cueEngineLabel: string;
  windowsHeardLabel: string;
  cuesEmittedLabel: string;
  linesProcessedLabel: string;
  anomaliesHeardLabel: string;
  beatClockLabel: string;
  freeLabel: string;
  voicesEmittedLabel: string;
  rhythmPulseLabel: string;
  activeLabel: string;
  offLabel: string;
}

export interface LiveMonitorDisplayState {
  currentLevelCounts: Record<string, number>;
  anomalySourceRows: AnomalySourceRow[];
  waveAnomalyMarkers: LiveLogMarker[];
  liveSourceLabel: string;
  recentSyncTailRows: SyncTailRow[];
  deckStatusLabel: string;
  audioStateLabel: string;
  audioBadgeLabel: string;
  audioBadgeTone: "ready" | "warn";
}

export interface SessionCardDisplay {
  title: string;
  sourceSummary: string;
  replayProgressSummary: string | null;
}

export interface MetricGridItem {
  label: string;
  value: string | number;
}

export type { AudioEngineStatus, SampleEngineStatus } from "./liveLogMonitorViewModel";
export {
  buildLiveMonitorDisplayState,
  resolveAudioStateLabel,
} from "./liveLogMonitorDisplayStateRuntime";
export {
  buildMetricGridItems,
  resolveBounceActionLabel,
  resolveCueEngineStateLabel,
  resolveSessionCardDisplay,
} from "./liveLogMonitorDisplayMetricsRuntime";
