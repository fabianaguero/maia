import { useCallback } from "react";

import type { LiveLogStreamUpdate } from "../../types/monitor";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";
import { useMonitorProviderReplayPlaybackRuntime } from "./useMonitorProviderReplayPlaybackRuntime";
import { useMonitorProviderReplayTelemetryRuntime } from "./useMonitorProviderReplayTelemetryRuntime";

export function useMonitorProviderReplayRuntime(
  input: UseMonitorProviderRuntimeOrchestrationInput,
  emitUpdate: (
    update: LiveLogStreamUpdate,
    options?: {
      accumulateMetrics?: boolean;
      persistPlaybackEvent?: boolean;
    },
  ) => void,
) {
  const { resetReplayTelemetry, syncReplayTelemetry, syncGuideTrackToReplayProgress } =
    useMonitorProviderReplayTelemetryRuntime(input);
  const { dispatchReplayEventAtIndex, replayTick } = useMonitorProviderReplayPlaybackRuntime({
    input,
    emitUpdate,
    syncReplayTelemetry,
    syncGuideTrackToReplayProgress,
  });

  return {
    resetReplayTelemetry,
    syncReplayTelemetry,
    syncGuideTrackToReplayProgress,
    dispatchReplayEventAtIndex,
    replayTick,
  };
}
