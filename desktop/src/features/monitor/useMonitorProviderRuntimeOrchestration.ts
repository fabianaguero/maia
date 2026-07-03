import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";
import { useMonitorProviderAudioRuntime } from "./useMonitorProviderAudioRuntime";
import { useMonitorProviderPollRuntime } from "./useMonitorProviderPollRuntime";
import { useMonitorProviderReplayRuntime } from "./useMonitorProviderReplayRuntime";

export function useMonitorProviderRuntimeOrchestration(
  input: UseMonitorProviderRuntimeOrchestrationInput,
) {
  const { stopPolling, emitUpdate, doPoll } = useMonitorProviderPollRuntime(input);
  const { resetReplayTelemetry, syncReplayTelemetry, dispatchReplayEventAtIndex, replayTick } =
    useMonitorProviderReplayRuntime(input, emitUpdate);
  const { ensureProviderAudioContext, buildLiveStartInput, resumeAudio } =
    useMonitorProviderAudioRuntime(input, {
      resetReplayTelemetry,
      doPoll,
    });

  return {
    stopPolling,
    resetReplayTelemetry,
    syncReplayTelemetry,
    emitUpdate,
    doPoll,
    ensureProviderAudioContext,
    buildLiveStartInput,
    dispatchReplayEventAtIndex,
    replayTick,
    resumeAudio,
  };
}
