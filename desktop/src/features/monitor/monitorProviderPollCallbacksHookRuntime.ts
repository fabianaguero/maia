import type { emitMonitorProviderUpdateState } from "./monitorProviderLiveRuntime";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export interface MonitorProviderPollLifecycleBindings {
  stopPolling: () => void;
  schedulePoll: (doPoll: () => Promise<void>) => void;
}

export interface MonitorProviderPollTransportBindings {
  emitUpdate: (
    update: Parameters<typeof emitMonitorProviderUpdateState>[0]["update"],
    options?: {
      accumulateMetrics?: boolean;
      persistPlaybackEvent?: boolean;
    },
  ) => void;
  doPoll: () => Promise<void>;
}

export function buildMonitorProviderPollTransportCallbacksInput(
  input: UseMonitorProviderRuntimeOrchestrationInput,
  deps: Pick<MonitorProviderPollLifecycleBindings, "schedulePoll">,
) {
  return {
    input,
    deps,
  };
}

export function buildMonitorProviderPollCallbacksResult(input: {
  lifecycle: MonitorProviderPollLifecycleBindings;
  transport: MonitorProviderPollTransportBindings;
}) {
  return {
    stopPolling: input.lifecycle.stopPolling,
    schedulePoll: input.lifecycle.schedulePoll,
    emitUpdate: input.transport.emitUpdate,
    doPoll: input.transport.doPoll,
  };
}
