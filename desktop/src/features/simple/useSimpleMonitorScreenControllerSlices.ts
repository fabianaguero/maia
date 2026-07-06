import { useSimpleMonitorAnomalyFilterState } from "./useSimpleMonitorAnomalyFilterState";
import { useSimpleMonitorDeckRuntime } from "./useSimpleMonitorDeckRuntime";
import { useSimpleMonitorLaunchState } from "./useSimpleMonitorLaunchState";
import {
  buildSimpleMonitorScreenControllerAnomalyFilterArgs,
  buildSimpleMonitorScreenControllerDeckRuntimeInput,
  buildSimpleMonitorScreenControllerLaunchStateInput,
  buildSimpleMonitorScreenControllerSlicesResult,
  type UseSimpleMonitorScreenControllerSlicesInput,
} from "./simpleMonitorScreenControllerHookRuntime";

export function useSimpleMonitorScreenControllerSlices({
  state,
  collections,
  isListening,
  t,
}: UseSimpleMonitorScreenControllerSlicesInput) {
  const launchState = useSimpleMonitorLaunchState(
    buildSimpleMonitorScreenControllerLaunchStateInput({
      state,
      collections,
      isListening,
      t,
    }),
  );

  const deckRuntime = useSimpleMonitorDeckRuntime(
    buildSimpleMonitorScreenControllerDeckRuntimeInput(
      {
        state,
        collections,
        isListening,
        t,
      },
      launchState,
    ),
  );

  const anomalyFilter = useSimpleMonitorAnomalyFilterState(
    buildSimpleMonitorScreenControllerAnomalyFilterArgs(state),
  );

  return buildSimpleMonitorScreenControllerSlicesResult({
    launchState,
    deckRuntime,
    anomalyFilter,
  });
}
