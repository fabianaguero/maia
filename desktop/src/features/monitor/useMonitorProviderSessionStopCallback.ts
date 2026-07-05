import { useCallback, useMemo } from "react";

import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";
import { buildMonitorProviderSessionStopCallbackInput } from "./monitorProviderSessionActionsHookRuntime";
import { stopMonitorProviderSessionAction } from "./monitorProviderSessionActionRuntime";

export function useMonitorProviderSessionStopCallback(
  input: UseMonitorProviderSessionActionsInput,
) {
  const stopSessionInput = useMemo(
    () => buildMonitorProviderSessionStopCallbackInput(input),
    [input],
  );

  const stopSession = useCallback(
    async (): Promise<void> => stopMonitorProviderSessionAction(stopSessionInput),
    [stopSessionInput],
  );

  return {
    stopSession,
  };
}
