import type { PersistedSession } from "../../api/sessions";
import type { AppTranslations } from "../../i18n/en";
import type { ActiveMonitorSession, MonitorMetrics } from "../monitor/MonitorContext";
import type {
  LiveLogComponentCount,
  LiveLogMarker,
  LiveLogStreamUpdate,
} from "../../types/library";
import { getStreamAdapterLabel } from "../../utils/streamAdapter";
import {
  formatMonitorConfidence,
  formatMonitorLevel,
  resolveModeLabel,
  type QuickSessionMode,
} from "./sessionDisplay";

type BoothTone = "replay" | "live" | "armed" | "idle";

export interface BoothStatItem {
  label: string;
  value: string;
  helper: string;
}

export interface SessionBoothViewModel {
  sourceLabel: string | null;
  sourcePath: string | null;
  baseLabel: string | null;
  baseDetail: string | null;
  adapterLabel: string;
  signalBpm: number | null;
  state: {
    tone: BoothTone;
    label: string;
  };
  headline: string;
  summary: string;
  levelCountEntries: Array<[string, number]>;
  topComponents: LiveLogComponentCount[];
  warningItems: string[];
  anomalyMarkers: LiveLogMarker[];
  stats: BoothStatItem[];
  progressAriaLabel: string;
  progressWidth: string;
}

interface BuildSessionBoothViewModelInput {
  t: AppTranslations;
  mode: QuickSessionMode;
  latestUpdate: LiveLogStreamUpdate | null;
  playbackActive: boolean;
  liveMonitorActive: boolean;
  readyToRun: boolean;
  playbackPercent: number | null;
  activeSession: PersistedSession | null;
  selectedSourceTitle: string | null;
  selectedSourcePath: string | null;
  selectedSourceSuggestedBpm: number | null;
  selectedSessionSourceLabel: string | null;
  selectedSessionSourcePath: string | null;
  selectedBaseLabel: string | null;
  selectedBaseDetail: string | null;
  selectedSessionBaseLabel: string | null;
  selectedSessionBaseDetail: string | null;
  activeBaseLabel: string | null;
  activeBaseDetail: string | null;
  activeSourceLabel: string | null;
  activeSourcePath: string | null;
  monitorSession: ActiveMonitorSession | null;
  monitorMetrics: MonitorMetrics;
  isPlaybackPaused: boolean;
  playbackEventIndex: number | null;
  playbackEventCount: number | null;
}

export function buildSessionBoothViewModel({
  t,
  mode,
  latestUpdate,
  playbackActive,
  liveMonitorActive,
  readyToRun,
  playbackPercent,
  activeSession,
  selectedSourceTitle,
  selectedSourcePath,
  selectedSourceSuggestedBpm,
  selectedSessionSourceLabel,
  selectedSessionSourcePath,
  selectedBaseLabel,
  selectedBaseDetail,
  selectedSessionBaseLabel,
  selectedSessionBaseDetail,
  activeBaseLabel,
  activeBaseDetail,
  activeSourceLabel,
  activeSourcePath,
  monitorSession,
  monitorMetrics,
  isPlaybackPaused,
  playbackEventIndex,
  playbackEventCount,
}: BuildSessionBoothViewModelInput): SessionBoothViewModel {
  const sourceLabel = liveMonitorActive
    ? (activeSourceLabel ?? monitorSession?.repoTitle ?? null)
    : (selectedSourceTitle ?? selectedSessionSourceLabel);
  const sourcePath = liveMonitorActive
    ? (activeSourcePath ?? monitorSession?.sourcePath ?? null)
    : (selectedSourcePath ?? selectedSessionSourcePath);
  const baseLabel = liveMonitorActive
    ? (activeBaseLabel ?? null)
    : (selectedBaseLabel ?? selectedSessionBaseLabel);
  const baseDetail = liveMonitorActive
    ? activeBaseDetail
    : (selectedBaseDetail ?? selectedSessionBaseDetail);
  const adapterLabel = monitorSession
    ? getStreamAdapterLabel(monitorSession.adapterKind)
    : resolveModeLabel(mode, t.session.logFile, t.session.repository);
  const signalBpm =
    latestUpdate?.suggestedBpm ??
    (liveMonitorActive ? (activeSession?.lastBpm ?? null) : (selectedSourceSuggestedBpm ?? null));
  const state = playbackActive
    ? isPlaybackPaused
      ? { tone: "replay" as const, label: t.session.replayPaused }
      : { tone: "replay" as const, label: t.session.replayActive }
    : liveMonitorActive
      ? latestUpdate?.hasData
        ? { tone: "live" as const, label: t.session.liveHot }
        : { tone: "armed" as const, label: t.session.listening }
      : readyToRun
        ? { tone: "armed" as const, label: t.session.boothArmed }
        : { tone: "idle" as const, label: t.session.boothIdle };
  const headline = playbackActive
    ? activeSession?.label || t.session.replayDeck
    : liveMonitorActive
      ? activeSession?.label || monitorSession?.repoTitle || t.session.liveMonitor
      : sourceLabel || t.session.armMonitor;
  const summary = playbackActive
    ? latestUpdate?.summary ||
      t.session.replayDeckSummary.replace("{progress}", String(playbackPercent ?? 0))
    : liveMonitorActive
      ? latestUpdate?.hasData
        ? latestUpdate.summary
        : t.session.waitingLiveWindow
      : readyToRun
        ? t.session.baseAndSourceArmed
        : t.session.chooseBaseAndSource;
  const levelCountEntries = Object.entries(latestUpdate?.levelCounts ?? {}).filter(
    ([, count]) => count > 0,
  );
  const topComponents = latestUpdate?.topComponents.slice(0, 5) ?? [];
  const warningItems = latestUpdate?.warnings.slice(0, 4) ?? [];
  const anomalyMarkers = latestUpdate?.anomalyMarkers.slice(0, 4) ?? [];
  const stats = playbackActive
    ? [
        {
          label: t.session.replay,
          value: `${playbackEventIndex ?? 0}/${playbackEventCount ?? activeSession?.totalPolls ?? 0}`,
          helper: t.session.windows,
        },
        {
          label: t.session.progress,
          value: `${playbackPercent ?? 0}%`,
          helper: t.session.complete,
        },
        {
          label: t.session.storedLines,
          value: `${activeSession?.totalLines ?? 0}`,
          helper: t.session.captured,
        },
        {
          label: t.session.storedAnomalies,
          value: `${activeSession?.totalAnomalies ?? 0}`,
          helper: t.session.saved,
        },
        {
          label: t.session.signalBpm,
          value: signalBpm ? `${signalBpm.toFixed(0)}` : "—",
          helper: signalBpm ? "bpm" : t.session.waiting,
        },
        {
          label: t.session.confidence,
          value: formatMonitorConfidence(latestUpdate?.confidence),
          helper: t.session.match,
        },
      ]
    : [
        {
          label: t.session.signalBpm,
          value: signalBpm ? `${signalBpm.toFixed(0)}` : "—",
          helper: signalBpm ? "bpm" : t.session.waiting,
        },
        {
          label: t.session.windows,
          value: `${monitorMetrics.windowCount}`,
          helper: t.session.processed,
        },
        {
          label: t.session.linesProcessed,
          value: `${monitorMetrics.processedLines}`,
          helper: t.session.streamed,
        },
        {
          label: t.session.anomaliesDetected,
          value: `${monitorMetrics.totalAnomalies}`,
          helper: t.session.detected,
        },
        {
          label: t.session.dominantLevel,
          value: formatMonitorLevel(latestUpdate?.dominantLevel, t.session.awaitingInput),
          helper: latestUpdate?.hasData ? t.session.latestWindow : t.session.idle,
        },
        {
          label: t.session.confidence,
          value: formatMonitorConfidence(latestUpdate?.confidence),
          helper: t.session.match,
        },
      ];

  const progressWidth = playbackActive
    ? `${playbackPercent ?? 0}%`
    : `${Math.max(
        12,
        Math.min(
          100,
          latestUpdate?.hasData
            ? latestUpdate.anomalyCount * 22 + latestUpdate.lineCount
            : monitorMetrics.windowCount * 12,
        ),
      )}%`;

  return {
    sourceLabel,
    sourcePath,
    baseLabel,
    baseDetail,
    adapterLabel,
    signalBpm,
    state,
    headline,
    summary,
    levelCountEntries,
    topComponents,
    warningItems,
    anomalyMarkers,
    stats,
    progressAriaLabel: playbackActive ? t.session.replayProgress : t.session.liveMonitoringActivity,
    progressWidth,
  };
}
