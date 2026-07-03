import { useT } from "../../i18n/I18nContext";
import { buildSimpleMonitorCollectionsState } from "./simpleMonitorScreenStateRuntime";
import {
  buildSimpleMonitorScreenControllerCollectionsInput,
  buildSimpleMonitorScreenControllerHookArgsInput,
  buildSimpleMonitorScreenControllerHookResult,
  buildSimpleMonitorScreenControllerRuntimeInput,
  buildSimpleMonitorScreenControllerSlicesHookInput,
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

  const { launchState, deckRuntime, anomalyFilter } = useSimpleMonitorScreenControllerSlices(
    buildSimpleMonitorScreenControllerSlicesHookInput({
      state: runtimeInput,
      collections,
      isListening,
      t,
    }),
  );

  const hookStateArgs = buildSimpleMonitorScreenHookArgsInput({
    ...buildSimpleMonitorScreenControllerHookArgsInput({
      state: runtimeInput,
      t,
      nowMs: Date.now(),
      onRefresh: () => window.location.reload(),
      launchState,
      deckRuntime,
      anomalyFilter,
      collections,
    }),
  });

  return buildSimpleMonitorScreenControllerHookResult(hookStateArgs);
}
