import { useCallback } from "react";

import {
  POLL_INTERVAL_MS,
  scheduleMonitorPoll,
  stopMonitorPollingState,
} from "./monitorSessionRuntime";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export function useMonitorProviderPollLifecycleCallbacks(
  input: UseMonitorProviderRuntimeOrchestrationInput,
) {
  const { live } = input;

  const stopPolling = useCallback(() => {
    stopMonitorPollingState({
      activeRef: live.activeRef,
      pollTimerRef: live.pollTimerRef,
      wsRef: live.wsRef,
      wsLineBufferRef: live.wsLineBufferRef,
      httpUrlRef: live.httpUrlRef,
      clearTimeoutFn: window.clearTimeout,
    });
  }, [live.activeRef, live.httpUrlRef, live.pollTimerRef, live.wsLineBufferRef, live.wsRef]);

  const schedulePoll = useCallback(
    (doPoll: () => Promise<void>) => {
      scheduleMonitorPoll({
        activeRef: live.activeRef,
        pollTimerRef: live.pollTimerRef,
        intervalMs: POLL_INTERVAL_MS,
        setTimeoutFn: window.setTimeout,
        doPoll,
      });
    },
    [live.activeRef, live.pollTimerRef],
  );

  return {
    stopPolling,
    schedulePoll,
  };
}
