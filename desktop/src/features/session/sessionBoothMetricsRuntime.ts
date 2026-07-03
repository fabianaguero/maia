import { formatMonitorConfidence, formatMonitorLevel } from "./sessionDisplay";
import type { BoothStatItem, BuildSessionBoothViewModelInput } from "./sessionBoothViewModelTypes";

export function resolveSessionBoothLevelEntries(
  latestUpdate: BuildSessionBoothViewModelInput["latestUpdate"],
): Array<[string, number]> {
  return Object.entries(latestUpdate?.levelCounts ?? {}).filter(([, count]) => count > 0);
}

export function resolveSessionBoothStats(input: {
  playbackActive: boolean;
  playbackEventIndex: number | null;
  playbackEventCount: number | null;
  activeSession: BuildSessionBoothViewModelInput["activeSession"];
  playbackPercent: number | null;
  signalBpm: number | null;
  latestUpdate: BuildSessionBoothViewModelInput["latestUpdate"];
  monitorMetrics: BuildSessionBoothViewModelInput["monitorMetrics"];
  t: BuildSessionBoothViewModelInput["t"];
}): BoothStatItem[] {
  return input.playbackActive
    ? [
        {
          label: input.t.session.replay,
          value: `${input.playbackEventIndex ?? 0}/${input.playbackEventCount ?? input.activeSession?.totalPolls ?? 0}`,
          helper: input.t.session.windows,
        },
        {
          label: input.t.session.progress,
          value: `${input.playbackPercent ?? 0}%`,
          helper: input.t.session.complete,
        },
        {
          label: input.t.session.storedLines,
          value: `${input.activeSession?.totalLines ?? 0}`,
          helper: input.t.session.captured,
        },
        {
          label: input.t.session.storedAnomalies,
          value: `${input.activeSession?.totalAnomalies ?? 0}`,
          helper: input.t.session.saved,
        },
        {
          label: input.t.session.signalBpm,
          value: input.signalBpm ? `${input.signalBpm.toFixed(0)}` : "—",
          helper: input.signalBpm ? "bpm" : input.t.session.waiting,
        },
        {
          label: input.t.session.confidence,
          value: formatMonitorConfidence(input.latestUpdate?.confidence),
          helper: input.t.session.match,
        },
      ]
    : [
        {
          label: input.t.session.signalBpm,
          value: input.signalBpm ? `${input.signalBpm.toFixed(0)}` : "—",
          helper: input.signalBpm ? "bpm" : input.t.session.waiting,
        },
        {
          label: input.t.session.windows,
          value: `${input.monitorMetrics.windowCount}`,
          helper: input.t.session.processed,
        },
        {
          label: input.t.session.linesProcessed,
          value: `${input.monitorMetrics.processedLines}`,
          helper: input.t.session.streamed,
        },
        {
          label: input.t.session.anomaliesDetected,
          value: `${input.monitorMetrics.totalAnomalies}`,
          helper: input.t.session.detected,
        },
        {
          label: input.t.session.dominantLevel,
          value: formatMonitorLevel(
            input.latestUpdate?.dominantLevel,
            input.t.session.awaitingInput,
          ),
          helper: input.latestUpdate?.hasData ? input.t.session.latestWindow : input.t.session.idle,
        },
        {
          label: input.t.session.confidence,
          value: formatMonitorConfidence(input.latestUpdate?.confidence),
          helper: input.t.session.match,
        },
      ];
}

export function resolveSessionBoothProgressWidth(input: {
  playbackActive: boolean;
  playbackPercent: number | null;
  latestUpdate: BuildSessionBoothViewModelInput["latestUpdate"];
  monitorMetrics: BuildSessionBoothViewModelInput["monitorMetrics"];
}): string {
  return input.playbackActive
    ? `${input.playbackPercent ?? 0}%`
    : `${Math.max(
        12,
        Math.min(
          100,
          input.latestUpdate?.hasData
            ? input.latestUpdate.anomalyCount * 22 + input.latestUpdate.lineCount
            : input.monitorMetrics.windowCount * 12,
        ),
      )}%`;
}
