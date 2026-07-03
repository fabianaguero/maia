import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";
import {
  buildMonitorProviderPollCallbacksResult,
  buildMonitorProviderPollTransportCallbacksInput,
} from "./monitorProviderPollCallbacksHookRuntime";
import { useMonitorProviderPollLifecycleCallbacks } from "./useMonitorProviderPollLifecycleCallbacks";
import { useMonitorProviderPollTransportCallbacks } from "./useMonitorProviderPollTransportCallbacks";

export function useMonitorProviderPollCallbacks(
  input: UseMonitorProviderRuntimeOrchestrationInput,
) {
  const lifecycle = useMonitorProviderPollLifecycleCallbacks(input);
  const transportInput = buildMonitorProviderPollTransportCallbacksInput(input, {
    schedulePoll: lifecycle.schedulePoll,
  });
  const transport = useMonitorProviderPollTransportCallbacks(
    transportInput.input,
    transportInput.deps,
  );

  return buildMonitorProviderPollCallbacksResult({
    lifecycle,
    transport,
  });
}
