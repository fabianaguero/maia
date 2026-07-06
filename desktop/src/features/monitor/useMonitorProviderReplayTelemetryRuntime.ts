import { useCallback } from "react";

import {
  resetReplayTelemetryState,
  syncGuideTrackCursorToReplayProgress,
  syncReplayTelemetryState,
} from "./monitorReplayRuntime";
import {
  buildSyncGuideTrackCursorStateInput,
  buildSyncReplayTelemetryStateInput,
} from "./monitorProviderOrchestrationRuntime";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export function useMonitorProviderReplayTelemetryRuntime(
  input: UseMonitorProviderRuntimeOrchestrationInput,
) {
  const { audio, playback, session } = input;

  const resetReplayTelemetry = useCallback(() => {
    resetReplayTelemetryState({
      replayEventsRef: playback.replayEventsRef,
      replayMetricsRef: playback.replayMetricsRef,
      replayIndexRef: playback.replayIndexRef,
      replayHydratingRef: playback.replayHydratingRef,
      replayHydrationTokenRef: playback.replayHydrationTokenRef,
      playbackPausedRef: playback.playbackPausedRef,
      setPlaybackProgress: playback.setPlaybackProgress,
      setIsPlaybackPaused: playback.setIsPlaybackPaused,
      setPlaybackEventIndex: playback.setPlaybackEventIndex,
      setPlaybackEventCount: playback.setPlaybackEventCount,
    });
  }, [playback]);

  const syncReplayTelemetry = useCallback(
    (processedEvents: number) => {
      syncReplayTelemetryState(
        buildSyncReplayTelemetryStateInput({
          processedEvents,
          replayEventsRef: playback.replayEventsRef,
          replayMetricsRef: playback.replayMetricsRef,
          setPlaybackEventCount: playback.setPlaybackEventCount,
          setPlaybackEventIndex: playback.setPlaybackEventIndex,
          setPlaybackProgress: playback.setPlaybackProgress,
          setMetrics: session.setMetrics,
        }),
      );
    },
    [playback, session.setMetrics],
  );

  const syncGuideTrackToReplayProgress = useCallback(
    (progress: number) => {
      syncGuideTrackCursorToReplayProgress(
        buildSyncGuideTrackCursorStateInput({
          pcm: audio.guideTrackRef.current,
          cursorRef: audio.guideTrackCursorRef,
          finishedRef: audio.guideTrackFinishedRef,
          progress,
        }),
      );
    },
    [audio.guideTrackCursorRef, audio.guideTrackFinishedRef, audio.guideTrackRef],
  );

  return {
    resetReplayTelemetry,
    syncReplayTelemetry,
    syncGuideTrackToReplayProgress,
  };
}
