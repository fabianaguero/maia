import { useCallback } from "react";

import { subscribeToMonitorStreamState } from "./monitorUpdateRuntime";
import type { StreamListener } from "./monitorContextTypes";
import type { UseMonitorProviderContextValueInput } from "./useMonitorProviderContextValue";

export function useMonitorProviderSubscribeCallback(
  input: Pick<UseMonitorProviderContextValueInput, "listenersRef" | "recentUpdatesRef" | "logger">,
) {
  return useCallback(
    (listener: StreamListener): (() => void) => {
      return subscribeToMonitorStreamState({
        listeners: input.listenersRef.current,
        listener,
        bufferedUpdates: input.recentUpdatesRef?.current ?? [],
        logger: input.logger,
      });
    },
    [input.listenersRef, input.recentUpdatesRef, input.logger],
  );
}
