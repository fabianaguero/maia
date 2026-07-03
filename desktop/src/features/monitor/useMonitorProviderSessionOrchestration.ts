import {
  buildMonitorProviderSessionOrchestrationDependencies,
  type UseMonitorProviderSessionOrchestrationInput,
} from "./monitorProviderSessionOrchestrationRuntime";
import { useMonitorProviderRuntimeOrchestration } from "./useMonitorProviderRuntimeOrchestration";
import { useMonitorProviderSessionActions } from "./useMonitorProviderSessionActions";

export function useMonitorProviderSessionOrchestration(
  input: UseMonitorProviderSessionOrchestrationInput,
) {
  const { runtimeOrchestrationInput, buildSessionActionsInput } =
    buildMonitorProviderSessionOrchestrationDependencies(input);

  const orchestration = useMonitorProviderRuntimeOrchestration(runtimeOrchestrationInput);

  const sessionActions = useMonitorProviderSessionActions(
    buildSessionActionsInput({
      stopPolling: orchestration.stopPolling,
      buildLiveStartInput: orchestration.buildLiveStartInput,
      ensureProviderAudioContext: orchestration.ensureProviderAudioContext,
      replayTick: orchestration.replayTick,
      syncReplayTelemetry: orchestration.syncReplayTelemetry,
      resetReplayTelemetry: orchestration.resetReplayTelemetry,
    }),
  );

  return {
    orchestration,
    sessionActions,
  };
}
