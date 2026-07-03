import {
  buildMonitorProviderRuntimeOrchestrationDependenciesFromState,
  type BuildMonitorProviderRuntimeOrchestrationFromStateInput,
} from "./monitorProviderControllerInputRuntime";
import { buildMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderControllerRuntimeDirectInputRuntime";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export function buildMonitorProviderRuntimeOrchestrationInputFromState(
  input: BuildMonitorProviderRuntimeOrchestrationFromStateInput,
): UseMonitorProviderRuntimeOrchestrationInput {
  return buildMonitorProviderRuntimeOrchestrationInput(
    buildMonitorProviderRuntimeOrchestrationDependenciesFromState(input),
  );
}
