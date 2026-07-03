import type { UseMonitorProviderReplayPlaybackRuntimeInput } from "./useMonitorProviderReplayPlaybackRuntimeTypes";
import { useMonitorProviderReplayDispatchCallback } from "./useMonitorProviderReplayDispatchCallback";
import { useMonitorProviderReplayTickCallback } from "./useMonitorProviderReplayTickCallback";

export function useMonitorProviderReplayPlaybackRuntime({
  input,
  emitUpdate,
  syncReplayTelemetry,
  syncGuideTrackToReplayProgress,
}: UseMonitorProviderReplayPlaybackRuntimeInput) {
  const runtimeInput = {
    input,
    emitUpdate,
    syncReplayTelemetry,
    syncGuideTrackToReplayProgress,
  };
  const dispatchReplayEventAtIndex = useMonitorProviderReplayDispatchCallback(runtimeInput);
  const replayTick = useMonitorProviderReplayTickCallback(runtimeInput, dispatchReplayEventAtIndex);

  return {
    dispatchReplayEventAtIndex,
    replayTick,
  };
}
