import { useCallback } from "react";

import { subscribeToMonitorStreamState } from "./monitorUpdateRuntime";
import type { StreamListener } from "./monitorContextTypes";
import type { UseMonitorProviderContextValueInput } from "./useMonitorProviderContextValue";

export function useMonitorProviderSubscribeCallback(
  input: Pick<UseMonitorProviderContextValueInput, "listenersRef" | "logger">,
) {
  return useCallback(
    (listener: StreamListener): (() => void) => {
      return subscribeToMonitorStreamState({
        listeners: input.listenersRef.current,
        listener,
        logger: input.logger,
      });
    },
    [input.listenersRef, input.logger],
  );
}
