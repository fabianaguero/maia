import { useT } from "../../i18n/I18nContext";
import { buildSimpleMonitorCollectionsState } from "./simpleMonitorScreenStateRuntime";
import {
  buildSimpleMonitorDeckRuntimeInput,
  buildSimpleMonitorLaunchStateInput,
  buildSimpleMonitorScreenHookArgsInput,
} from "./simpleMonitorScreenOrchestrationRuntime";
import {
  buildSimpleMonitorDeckRuntimeSlice,
  buildSimpleMonitorLaunchStateSlice,
} from "./simpleMonitorScreenSlicesRuntime";
import { useSimpleMonitorAnomalyFilterState } from "./useSimpleMonitorAnomalyFilterState";
import { useSimpleMonitorDeckRuntime } from "./useSimpleMonitorDeckRuntime";
import { useSimpleMonitorLaunchState } from "./useSimpleMonitorLaunchState";
import type { SimpleMonitorScreenStateInput } from "./useSimpleMonitorScreenState";

export function useSimpleMonitorScreenController({
  skin,
  session,
  metrics,
  pastSessions,
  repositories,
  tracks,
  onStop,
  onResumeAudio,
  audioStatus,
  audioContext,
  onStartMonitoring,
  onReplaySession,
  subscribe,
  trackName,
  waveformBins,
  isConsoleExpanded = false,
  onToggleConsole,
  liveSettings,
}: SimpleMonitorScreenStateInput) {
  const t = useT();
  const isListening = !!session;
  const collections = buildSimpleMonitorCollectionsState({
    pastSessions,
    repositories,
    tracks,
  });

  const launchState = useSimpleMonitorLaunchState(
    buildSimpleMonitorLaunchStateInput({
      repositories: collections.safeRepositories,
      isListening,
      t,
      onResumeAudio,
      onStartMonitoring,
    }),
  );

  const deckRuntime = useSimpleMonitorDeckRuntime(
    buildSimpleMonitorDeckRuntimeInput({
      skin,
      session,
      isListening,
      isLaunchingMonitor: launchState.isLaunchingMonitor,
      safeTracks: collections.safeTracks,
      trackName,
      audioContext,
      subscribe,
      waveformBins,
      isConsoleExpanded,
      onToggleConsole,
      liveSettings,
      t,
    }),
  );

  const anomalyFilter = useSimpleMonitorAnomalyFilterState({
    isConsoleExpanded,
    onToggleConsole,
  });

  const hookStateArgs = buildSimpleMonitorScreenHookArgsInput({
    session,
    metrics,
    t,
    nowMs: Date.now(),
    trackName,
    isConsoleExpanded,
    onToggleConsole,
    onStop,
    onRefresh: () => window.location.reload(),
    onSimulateLog: deckRuntime.simulateLog,
    onResumeAudio,
    onReplaySession,
    isAnomalyFilterActive: anomalyFilter.isAnomalyFilterActive,
    onToggleAnomalyFilter: anomalyFilter.handleToggleAnomalyFilter,
    onClearAnomalyFilter: anomalyFilter.handleClearAnomalyFilter,
    launchState: buildSimpleMonitorLaunchStateSlice(launchState),
    deckRuntime: buildSimpleMonitorDeckRuntimeSlice(deckRuntime),
    collections,
    audioStatus,
  });

  return {
    hookStateArgs,
  };
}
