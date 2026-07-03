import { useMemo, type MutableRefObject } from "react";

import type { MonitorContextValue, StreamListener } from "./monitorContextTypes";
import {
  buildMonitorProviderContextHookDeps,
  buildMonitorProviderContextHookValue,
} from "./monitorProviderContextValueHookRuntime";
import { buildMonitorProviderMemoContextValue } from "./monitorProviderContextValueMemoRuntime";
import { useMonitorProviderSubscribeCallback } from "./useMonitorProviderSubscribeCallback";

interface MonitorProviderContextLogger {
  info: (message: string, ...args: unknown[]) => void;
}

export interface UseMonitorProviderContextValueInput extends Omit<
  MonitorContextValue,
  "subscribe"
> {
  listenersRef: MutableRefObject<Set<StreamListener>>;
  logger: MonitorProviderContextLogger;
}

export function useMonitorProviderContextValue(
  input: UseMonitorProviderContextValueInput,
): MonitorContextValue {
  const subscribe = useMonitorProviderSubscribeCallback(input);

  return useMemo(
    () =>
      buildMonitorProviderMemoContextValue({
        value: buildMonitorProviderContextHookValue(input),
        subscribe,
      }),
    buildMonitorProviderContextHookDeps(input, subscribe),
  );
}
