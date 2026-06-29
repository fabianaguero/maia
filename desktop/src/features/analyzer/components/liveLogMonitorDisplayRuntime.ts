import type { LiveLogMarker, LiveLogStreamUpdate } from "../../../types/library";
import type { ActiveMonitorSession } from "../../monitor/monitorContextTypes";
import { getStreamAdapterLabel } from "../../../utils/streamAdapter";
import {
  resolveAnomalySourceRows,
  type AnomalySourceRow,
  type SyncTailRow,
} from "./liveLogMonitorPanelRuntime";
import type { AudioEngineStatus, SampleEngineStatus } from "./liveLogMonitorViewModel";

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

export function resolveCueEngineStateLabel(input: {
  sampleStatus: SampleEngineStatus;
  sampleSourceCount: number;
  labels: Pick<
    LiveMonitorDisplayLabels,
    | "cueEngineBaseSamplePack"
    | "cueEngineBaseSample"
    | "cueEngineLoadingSample"
    | "cueEngineInternalSynth"
  >;
}): string {
  if (input.sampleStatus === "ready") {
    return input.sampleSourceCount > 1
      ? input.labels.cueEngineBaseSamplePack
      : input.labels.cueEngineBaseSample;
  }

  if (input.sampleStatus === "loading") {
    return input.labels.cueEngineLoadingSample;
  }

  return input.labels.cueEngineInternalSynth;
}

export function resolveBounceActionLabel(
  bounceWindowCount: number,
  bounceWindowSeconds: number,
): { label: string; title: string } | null {
  if (bounceWindowCount <= 0) {
    return null;
  }

  const secondsLabel = (bounceWindowCount * bounceWindowSeconds).toFixed(0);

  return {
    label: `↓ Bounce ${secondsLabel}s`,
    title: `Bounce ${secondsLabel}s of session audio to WAV`,
  };
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

export function resolveSessionCardDisplay(input: {
  session: ActiveMonitorSession;
  replayActive: boolean;
  playbackPercent: number | null;
  windowsHeard: number;
  labels: Pick<
    LiveMonitorDisplayLabels,
    | "replaySessionTitle"
    | "sessionTitle"
    | "storedSourceReplay"
    | "fallbackDirectFilePoll"
    | "replayComplete"
    | "windowsReplayed"
  >;
}): SessionCardDisplay {
  const sourceSummary = input.replayActive
    ? `${input.labels.storedSourceReplay} · ${input.session.sourcePath}`
    : input.session.pollMode === "direct"
      ? input.labels.fallbackDirectFilePoll
      : input.session.pollMode === "websocket"
        ? `${getStreamAdapterLabel("websocket")} · ${input.session.sourcePath}`
        : input.session.pollMode === "http-poll"
          ? `${getStreamAdapterLabel("http-poll")} · ${input.session.sourcePath}`
          : `${getStreamAdapterLabel(input.session.adapterKind)} · ${input.session.sourcePath}`;

  return {
    title: input.replayActive ? input.labels.replaySessionTitle : input.labels.sessionTitle,
    sourceSummary,
    replayProgressSummary:
      input.replayActive && input.playbackPercent !== null
        ? `${input.playbackPercent}% ${input.labels.replayComplete} · ${input.labels.windowsReplayed.replace("{count}", String(input.windowsHeard))}`
        : null,
  };
}

export function buildMetricGridItems(input: {
  replayActive: boolean;
  replaySessionTitle: string;
  activeAdapterLabel: string;
  audioStateLabel: string;
  styleProfileLabel: string;
  mutationProfileLabel: string;
  cueEngineStateLabel: string;
  playbackWindowLabel: string | null;
  windowsHeard: number;
  cuesEmitted: number;
  processedLines: number;
  anomaliesHeard: number;
  beatClockBpm: number | null;
  voicesEmitted: number;
  beatLooperActive: boolean;
  labels: Pick<
    LiveMonitorDisplayLabels,
    | "modeLabel"
    | "audioEngineLabel"
    | "styleProfileTitle"
    | "mutationProfileTitle"
    | "cueEngineLabel"
    | "windowsHeardLabel"
    | "cuesEmittedLabel"
    | "linesProcessedLabel"
    | "anomaliesHeardLabel"
    | "beatClockLabel"
    | "freeLabel"
    | "voicesEmittedLabel"
    | "rhythmPulseLabel"
    | "activeLabel"
    | "offLabel"
  >;
}): MetricGridItem[] {
  return [
    {
      label: input.labels.modeLabel,
      value: input.replayActive ? input.replaySessionTitle : input.activeAdapterLabel,
    },
    {
      label: input.labels.audioEngineLabel,
      value: input.audioStateLabel,
    },
    {
      label: input.labels.styleProfileTitle,
      value: input.styleProfileLabel,
    },
    {
      label: input.labels.mutationProfileTitle,
      value: input.mutationProfileLabel,
    },
    {
      label: input.labels.cueEngineLabel,
      value: input.cueEngineStateLabel,
    },
    {
      label: input.labels.windowsHeardLabel,
      value:
        input.replayActive && input.playbackWindowLabel
          ? input.playbackWindowLabel
          : input.windowsHeard,
    },
    {
      label: input.labels.cuesEmittedLabel,
      value: input.cuesEmitted,
    },
    {
      label: input.labels.linesProcessedLabel,
      value: input.processedLines,
    },
    {
      label: input.labels.anomaliesHeardLabel,
      value: input.anomaliesHeard,
    },
    {
      label: input.labels.beatClockLabel,
      value:
        input.beatClockBpm !== null
          ? `${input.beatClockBpm.toFixed(0)} BPM`
          : input.labels.freeLabel,
    },
    {
      label: input.labels.voicesEmittedLabel,
      value: input.voicesEmitted,
    },
    {
      label: input.labels.rhythmPulseLabel,
      value: input.beatLooperActive ? input.labels.activeLabel : input.labels.offLabel,
    },
  ];
}
