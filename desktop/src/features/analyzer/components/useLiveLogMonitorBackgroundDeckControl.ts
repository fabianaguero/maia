import { useCallback } from "react";

import { clearBackgroundTransitionTimer } from "./liveLogMonitorBackgroundDeckHookRuntime";
import { useLiveLogMonitorBackgroundDeckEventHandlers } from "./useLiveLogMonitorBackgroundDeckEventHandlers";
import type {
  UseLiveLogMonitorBackgroundDeckControlInput,
  UseLiveLogMonitorBackgroundDeckControlResult,
} from "./useLiveLogMonitorBackgroundDeckControlTypes";

export function useLiveLogMonitorBackgroundDeckControl(
  input: UseLiveLogMonitorBackgroundDeckControlInput,
): UseLiveLogMonitorBackgroundDeckControlResult {
  const clearBackgroundTransition = useCallback(() => {
    clearBackgroundTransitionTimer({
      backgroundTransitionTimerRef: input.backgroundTransitionTimerRef,
    });
  }, [input.backgroundTransitionTimerRef]);

  const eventHandlers = useLiveLogMonitorBackgroundDeckEventHandlers({
    hookInput: input,
    clearBackgroundTransition,
  });

  return {
    clearBackgroundTransition,
    ...eventHandlers,
  };
}
