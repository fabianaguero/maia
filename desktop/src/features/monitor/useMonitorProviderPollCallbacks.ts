import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";
import { useMonitorProviderPollLifecycleCallbacks } from "./useMonitorProviderPollLifecycleCallbacks";
import { useMonitorProviderPollTransportCallbacks } from "./useMonitorProviderPollTransportCallbacks";

export function useMonitorProviderPollCallbacks(
  input: UseMonitorProviderRuntimeOrchestrationInput,
) {
  const { stopPolling, schedulePoll } = useMonitorProviderPollLifecycleCallbacks(input);
  const { emitUpdate, doPoll } = useMonitorProviderPollTransportCallbacks(input, {
    schedulePoll,
  });

  return {
    stopPolling,
    schedulePoll,
    emitUpdate,
    doPoll,
  };
}
