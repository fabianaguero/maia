import type {
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

export function buildSessionBoothViewModelState(
  input: BuildSessionBoothViewModelInput,
): Omit<SessionBoothViewModel, "topComponents" | "warningItems" | "anomalyMarkers"> {
  const { sourceLabel, sourcePath, baseLabel, baseDetail, adapterLabel, signalBpm } =
    resolveSessionBoothSourceState(input);
  const state = resolveSessionBoothState({
    playbackActive: input.playbackActive,
    isPlaybackPaused: input.isPlaybackPaused,
    liveMonitorActive: input.liveMonitorActive,
    readyToRun: input.readyToRun,
    latestUpdate: input.latestUpdate,
    t: input.t,
  });
  const headline = resolveSessionBoothHeadline({
    playbackActive: input.playbackActive,
    liveMonitorActive: input.liveMonitorActive,
    activeSession: input.activeSession,
    monitorSession: input.monitorSession,
    sourceLabel,
    t: input.t,
  });
  const summary = resolveSessionBoothSummary({
    playbackActive: input.playbackActive,
    liveMonitorActive: input.liveMonitorActive,
    readyToRun: input.readyToRun,
    latestUpdate: input.latestUpdate,
    playbackPercent: input.playbackPercent,
    t: input.t,
  });
  const stats = resolveSessionBoothStats({
    playbackActive: input.playbackActive,
    playbackEventIndex: input.playbackEventIndex,
    playbackEventCount: input.playbackEventCount,
    activeSession: input.activeSession,
    playbackPercent: input.playbackPercent,
    signalBpm,
    latestUpdate: input.latestUpdate,
    monitorMetrics: input.monitorMetrics,
    t: input.t,
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
    levelCountEntries: resolveSessionBoothLevelEntries(input.latestUpdate),
    stats,
    progressAriaLabel: input.playbackActive
      ? input.t.session.replayProgress
      : input.t.session.liveMonitoringActivity,
    progressWidth: resolveSessionBoothProgressWidth({
      playbackActive: input.playbackActive,
      playbackPercent: input.playbackPercent,
      latestUpdate: input.latestUpdate,
      monitorMetrics: input.monitorMetrics,
    }),
  };
}

export function buildSessionBoothViewModelCollections(
  latestUpdate: BuildSessionBoothViewModelInput["latestUpdate"],
) {
  return {
    topComponents: latestUpdate?.topComponents.slice(0, 5) ?? [],
    warningItems: latestUpdate?.warnings.slice(0, 4) ?? [],
    anomalyMarkers: latestUpdate?.anomalyMarkers.slice(0, 4) ?? [],
  };
}
