import { useT } from "../../i18n/I18nContext";
import { buildSimpleMonitorCollectionsState } from "./simpleMonitorScreenStateRuntime";
import {
  buildSimpleMonitorScreenControllerCollectionsInput,
  buildSimpleMonitorScreenControllerHookResult,
  buildSimpleMonitorScreenControllerRuntimeInput,
} from "./simpleMonitorScreenControllerHookRuntime";
import { buildSimpleMonitorScreenHookArgsInput } from "./simpleMonitorScreenOrchestrationRuntime";
import type { SimpleMonitorScreenStateInput } from "./useSimpleMonitorScreenState";
import { useSimpleMonitorScreenControllerSlices } from "./useSimpleMonitorScreenControllerSlices";

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
  const runtimeInput = buildSimpleMonitorScreenControllerRuntimeInput({
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
    isConsoleExpanded,
    onToggleConsole,
    liveSettings,
  });
  const t = useT();
  const isListening = !!runtimeInput.session;
  const collections = buildSimpleMonitorCollectionsState(
    buildSimpleMonitorScreenControllerCollectionsInput(runtimeInput),
  );

  const { launchState, deckRuntime, anomalyFilter } = useSimpleMonitorScreenControllerSlices({
    state: runtimeInput,
    collections,
    isListening,
    t,
  });

  const hookStateArgs = buildSimpleMonitorScreenHookArgsInput({
    session: runtimeInput.session,
    metrics: runtimeInput.metrics,
    t,
    nowMs: Date.now(),
    trackName: runtimeInput.trackName,
    isConsoleExpanded: runtimeInput.isConsoleExpanded ?? false,
    onToggleConsole: runtimeInput.onToggleConsole,
    onStop: runtimeInput.onStop,
    onRefresh: () => window.location.reload(),
    onSimulateLog: deckRuntime.simulateLog,
    onResumeAudio: runtimeInput.onResumeAudio,
    onReplaySession: runtimeInput.onReplaySession,
    isAnomalyFilterActive: anomalyFilter.isAnomalyFilterActive,
    onToggleAnomalyFilter: anomalyFilter.handleToggleAnomalyFilter,
    onClearAnomalyFilter: anomalyFilter.handleClearAnomalyFilter,
    launchState,
    deckRuntime,
    collections,
    audioStatus: runtimeInput.audioStatus,
  });

  return buildSimpleMonitorScreenControllerHookResult(hookStateArgs);
}
