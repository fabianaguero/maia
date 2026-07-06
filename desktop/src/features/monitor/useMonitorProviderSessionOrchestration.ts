import {
  buildMonitorProviderSessionOrchestrationDependencies,
  type UseMonitorProviderSessionOrchestrationInput,
} from "./monitorProviderSessionOrchestrationRuntime";
import {
  buildMonitorProviderSessionActionsHookInput,
  buildMonitorProviderSessionOrchestrationResult,
  buildMonitorProviderSessionRuntimeDependencies,
} from "./monitorProviderSessionOrchestrationHookRuntime";
import { useMonitorProviderRuntimeOrchestration } from "./useMonitorProviderRuntimeOrchestration";
import { useMonitorProviderSessionActions } from "./useMonitorProviderSessionActions";

export function useMonitorProviderSessionOrchestration(
  input: UseMonitorProviderSessionOrchestrationInput,
) {
  const runtimeDependencies = buildMonitorProviderSessionRuntimeDependencies(input);
  const dependencies = buildMonitorProviderSessionOrchestrationDependencies(runtimeDependencies);

  const orchestration = useMonitorProviderRuntimeOrchestration(
    dependencies.runtimeOrchestrationInput,
  );

  const sessionActions = useMonitorProviderSessionActions(
    buildMonitorProviderSessionActionsHookInput(dependencies, orchestration),
  );

  return buildMonitorProviderSessionOrchestrationResult({
    orchestration,
    sessionActions,
  });
}
