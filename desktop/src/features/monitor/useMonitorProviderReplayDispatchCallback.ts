import { useCallback } from "react";

import { dispatchReplayEventAtIndexState } from "./monitorPlaybackRuntime";
import { buildDispatchReplayEventAtIndexStateInput } from "./monitorProviderOrchestrationRuntime";
import { buildMonitorProviderDispatchReplayEventAtIndexHookInput } from "./monitorProviderReplayPlaybackHookRuntime";
import type { UseMonitorProviderReplayPlaybackRuntimeInput } from "./useMonitorProviderReplayPlaybackRuntimeTypes";

export function useMonitorProviderReplayDispatchCallback({
  input,
  emitUpdate,
  syncReplayTelemetry,
  syncGuideTrackToReplayProgress,
}: UseMonitorProviderReplayPlaybackRuntimeInput) {
  const { playback, session } = input;

  return useCallback(
    (eventIndex: number, options?: { syncGuideTrack?: boolean }) =>
      dispatchReplayEventAtIndexState(
        buildDispatchReplayEventAtIndexStateInput(
          buildMonitorProviderDispatchReplayEventAtIndexHookInput(
            {
              input,
              emitUpdate,
              syncReplayTelemetry,
              syncGuideTrackToReplayProgress,
            },
            eventIndex,
            options?.syncGuideTrack,
          ),
        ),
      ),
    [
      input,
      emitUpdate,
      playback.replayEventsRef,
      playback.replayIndexRef,
      session.sessionRef,
      syncGuideTrackToReplayProgress,
      syncReplayTelemetry,
    ],
  );
}
