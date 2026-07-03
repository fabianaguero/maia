import {
  buildMonitorProviderRuntimeOrchestrationExternalDependencies,
  buildMonitorProviderRuntimeOrchestrationStateDependencies,
} from "./monitorProviderControllerInputSliceRuntime";
import type {
  BuildMonitorProviderRuntimeOrchestrationDependencies,
  BuildMonitorProviderRuntimeOrchestrationFromStateInput,
} from "./monitorProviderControllerInputTypes";

export type {
  BuildMonitorProviderRuntimeOrchestrationDependencies,
  BuildMonitorProviderRuntimeOrchestrationFromStateInput,
} from "./monitorProviderControllerInputTypes";

export function buildMonitorProviderRuntimeOrchestrationDependenciesFromState(
  input: BuildMonitorProviderRuntimeOrchestrationFromStateInput,
): BuildMonitorProviderRuntimeOrchestrationDependencies {
  return {
    ...buildMonitorProviderRuntimeOrchestrationStateDependencies(input.state),
    ...buildMonitorProviderRuntimeOrchestrationExternalDependencies(input),
  };
}
