import { useMemo } from "react";
import { useT } from "../../i18n/I18nContext";
import { buildSimpleMonitorScreenControllerHookArgsInput } from "./simpleMonitorScreenControllerHookRuntime";
import { buildSimpleMonitorScreenHookArgsInput } from "./simpleMonitorScreenOrchestrationRuntime";
import {
  buildSimpleMonitorScreenControllerCollections,
  buildSimpleMonitorScreenControllerSlicesInput,
  buildSimpleMonitorScreenControllerState,
} from "./simpleMonitorScreenControllerStateRuntime";
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
  const t = useT();
  const controllerState = useMemo(
    () =>
      buildSimpleMonitorScreenControllerState({
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
      }),
    [
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
    ],
  );
  const isListening = !!controllerState.session;
  const collections = useMemo(
    () => buildSimpleMonitorScreenControllerCollections({ pastSessions, repositories, tracks }),
    [pastSessions, repositories, tracks],
  );

  const { launchState, deckRuntime, anomalyFilter } = useSimpleMonitorScreenControllerSlices(
    buildSimpleMonitorScreenControllerSlicesInput({
      state: controllerState,
      collections,
      isListening,
      t,
    }),
  );

  const hookStateArgs = useMemo(
    () =>
      buildSimpleMonitorScreenHookArgsInput(
        buildSimpleMonitorScreenControllerHookArgsInput({
          state: controllerState,
          t,
          nowMs: Date.now(),
          onRefresh: () => window.location.reload(),
          launchState,
          deckRuntime,
          anomalyFilter,
          collections,
        }),
      ),
    [anomalyFilter, collections, controllerState, deckRuntime, launchState, t],
  );

  return {
    hookStateArgs,
  };
}
