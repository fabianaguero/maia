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
    [emitUpdate, input, syncGuideTrackToReplayProgress, syncReplayTelemetry],
  );
}
