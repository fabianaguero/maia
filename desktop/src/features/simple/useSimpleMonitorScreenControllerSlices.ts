import { useSimpleMonitorAnomalyFilterState } from "./useSimpleMonitorAnomalyFilterState";
import { useSimpleMonitorDeckRuntime } from "./useSimpleMonitorDeckRuntime";
import { useSimpleMonitorLaunchState } from "./useSimpleMonitorLaunchState";
import {
  buildSimpleMonitorScreenControllerAnomalyFilterArgs,
  buildSimpleMonitorScreenControllerDeckHookArgs,
  buildSimpleMonitorScreenControllerLaunchHookArgs,
} from "./simpleMonitorScreenControllerHookRuntime";
import {
  buildSimpleMonitorDeckRuntimeInput,
  buildSimpleMonitorLaunchStateInput,
} from "./simpleMonitorScreenOrchestrationRuntime";
import {
  buildSimpleMonitorDeckRuntimeSlice,
  buildSimpleMonitorLaunchStateSlice,
} from "./simpleMonitorScreenSlicesRuntime";
import type { AppTranslations } from "../../i18n/en";
import type { SimpleMonitorCollectionsState } from "./simpleMonitorScreenStateRuntime";
import type { SimpleMonitorScreenStateInput } from "./useSimpleMonitorScreenState";

interface UseSimpleMonitorScreenControllerSlicesInput {
  state: SimpleMonitorScreenStateInput;
  collections: SimpleMonitorCollectionsState;
  isListening: boolean;
  t: AppTranslations;
}

export function useSimpleMonitorScreenControllerSlices({
  state,
  collections,
  isListening,
  t,
}: UseSimpleMonitorScreenControllerSlicesInput) {
  const launchState = useSimpleMonitorLaunchState(
    buildSimpleMonitorLaunchStateInput({
      ...buildSimpleMonitorScreenControllerLaunchHookArgs({
        collections,
        isListening,
        t,
        onResumeAudio: state.onResumeAudio,
        onStartMonitoring: state.onStartMonitoring,
      }),
    }),
  );

  const deckRuntime = useSimpleMonitorDeckRuntime(
    buildSimpleMonitorDeckRuntimeInput({
      ...buildSimpleMonitorScreenControllerDeckHookArgs({
        state,
        isListening,
        isLaunchingMonitor: launchState.isLaunchingMonitor,
        collections,
        t,
      }),
    }),
  );

  const anomalyFilter = useSimpleMonitorAnomalyFilterState(
    buildSimpleMonitorScreenControllerAnomalyFilterArgs(state),
  );

  return {
    launchState: buildSimpleMonitorLaunchStateSlice(launchState),
    deckRuntime: buildSimpleMonitorDeckRuntimeSlice(deckRuntime),
    anomalyFilter,
  };
}
