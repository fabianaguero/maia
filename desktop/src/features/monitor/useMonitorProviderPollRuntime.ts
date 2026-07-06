import { useMonitorProviderPollCallbacks } from "./useMonitorProviderPollCallbacks";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export function useMonitorProviderPollRuntime(input: UseMonitorProviderRuntimeOrchestrationInput) {
  return useMonitorProviderPollCallbacks(input);
}
