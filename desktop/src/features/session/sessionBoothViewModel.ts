export type {
  BoothStatItem,
  BuildSessionBoothViewModelInput,
  SessionBoothViewModel,
} from "./sessionBoothViewModelTypes";

import {
  resolveSessionBoothHeadline,
  resolveSessionBoothState,
  resolveSessionBoothSummary,
} from "./sessionBoothStateRuntime";
import {
  resolveSessionBoothLevelEntries,
  resolveSessionBoothProgressWidth,
  resolveSessionBoothStats,
} from "./sessionBoothMetricsRuntime";
import { resolveSessionBoothSourceState } from "./sessionBoothSourceRuntime";
import type {
  BuildSessionBoothViewModelInput,
  SessionBoothViewModel,
} from "./sessionBoothViewModelTypes";

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
  const { sourceLabel, sourcePath, baseLabel, baseDetail, adapterLabel, signalBpm } =
    resolveSessionBoothSourceState({
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
    });
  const state = resolveSessionBoothState({
    playbackActive,
    isPlaybackPaused,
    liveMonitorActive,
    readyToRun,
    latestUpdate,
    t,
  });
  const headline = resolveSessionBoothHeadline({
    playbackActive,
    liveMonitorActive,
    activeSession,
    monitorSession,
    sourceLabel,
    t,
  });
  const summary = resolveSessionBoothSummary({
    playbackActive,
    liveMonitorActive,
    readyToRun,
    latestUpdate,
    playbackPercent,
    t,
  });
  const levelCountEntries = resolveSessionBoothLevelEntries(latestUpdate);
  const topComponents = latestUpdate?.topComponents.slice(0, 5) ?? [];
  const warningItems = latestUpdate?.warnings.slice(0, 4) ?? [];
  const anomalyMarkers = latestUpdate?.anomalyMarkers.slice(0, 4) ?? [];
  const stats = resolveSessionBoothStats({
    playbackActive,
    playbackEventIndex,
    playbackEventCount,
    activeSession,
    playbackPercent,
    signalBpm,
    latestUpdate,
    monitorMetrics,
    t,
  });
  const progressWidth = resolveSessionBoothProgressWidth({
    playbackActive,
    playbackPercent,
    latestUpdate,
    monitorMetrics,
  });

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
