import type { UseMonitorProviderSessionActionsResult } from "./monitorProviderSessionActionTypes";
import type { UseMonitorProviderSessionOrchestrationInput } from "./monitorProviderSessionOrchestrationRuntime";
import type { buildMonitorProviderSessionOrchestrationDependencies } from "./monitorProviderSessionOrchestrationRuntime";
import type { useMonitorProviderRuntimeOrchestration } from "./useMonitorProviderRuntimeOrchestration";

type MonitorProviderRuntimeOrchestrationResult = ReturnType<
  typeof useMonitorProviderRuntimeOrchestration
>;
type MonitorProviderSessionOrchestrationDependencies = ReturnType<
  typeof buildMonitorProviderSessionOrchestrationDependencies
>;

export interface MonitorProviderSessionOrchestrationResult {
  orchestration: MonitorProviderRuntimeOrchestrationResult;
  sessionActions: UseMonitorProviderSessionActionsResult;
}

export function buildMonitorProviderSessionActionsHookInput(
  dependencies: MonitorProviderSessionOrchestrationDependencies,
  orchestration: Pick<
    MonitorProviderRuntimeOrchestrationResult,
    | "stopPolling"
    | "buildLiveStartInput"
    | "ensureProviderAudioContext"
    | "replayTick"
    | "syncReplayTelemetry"
    | "resetReplayTelemetry"
  >,
) {
  return dependencies.buildSessionActionsInput({
    stopPolling: orchestration.stopPolling,
    buildLiveStartInput: orchestration.buildLiveStartInput,
    ensureProviderAudioContext: orchestration.ensureProviderAudioContext,
    replayTick: orchestration.replayTick,
    syncReplayTelemetry: orchestration.syncReplayTelemetry,
    resetReplayTelemetry: orchestration.resetReplayTelemetry,
  });
}

export function buildMonitorProviderSessionOrchestrationResult(input: {
  orchestration: MonitorProviderRuntimeOrchestrationResult;
  sessionActions: UseMonitorProviderSessionActionsResult;
}): MonitorProviderSessionOrchestrationResult {
  return input;
}

export function buildMonitorProviderSessionRuntimeDependencies(
  input: UseMonitorProviderSessionOrchestrationInput,
): UseMonitorProviderSessionOrchestrationInput {
  return input;
}
