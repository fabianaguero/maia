import { useSimpleMonitorDeckVisualState } from "./useSimpleMonitorDeckVisualState";
import { useSimpleMonitorLiveTail } from "./useSimpleMonitorLiveTail";
import {
  buildSimpleMonitorDeckPresentationHookResult,
  buildSimpleMonitorDeckPresentationRuntimeInput,
  buildSimpleMonitorDeckPresentationTailHookArgs,
  buildSimpleMonitorDeckPresentationVisualHookArgs,
} from "./simpleMonitorDeckPresentationHookRuntime";
import {
  buildSimpleMonitorDeckVisualHookInput,
  buildSimpleMonitorLiveTailHookInput,
} from "./simpleMonitorDeckPresentationRuntime";
import type { UseSimpleMonitorDeckPresentationStateInput } from "./simpleMonitorDeckPresentationTypes";

export function useSimpleMonitorDeckPresentationState(
  input: UseSimpleMonitorDeckPresentationStateInput,
) {
  const runtimeInput = buildSimpleMonitorDeckPresentationRuntimeInput(input);
  const tailState = useSimpleMonitorLiveTail(
    buildSimpleMonitorLiveTailHookInput({
      ...buildSimpleMonitorDeckPresentationTailHookArgs({
        liveLines: runtimeInput.liveLines,
        selectedAnomalyId: runtimeInput.selectedAnomalyId,
        setSelectedAnomalyId: runtimeInput.setSelectedAnomalyId,
      }),
    }),
  );
  const visualState = useSimpleMonitorDeckVisualState(
    buildSimpleMonitorDeckVisualHookInput({
      ...buildSimpleMonitorDeckPresentationVisualHookArgs({
        state: runtimeInput,
        focusAnomaly: tailState.focusAnomaly,
      }),
    }),
  );

  return buildSimpleMonitorDeckPresentationHookResult({
    tailState,
    visualState,
  });
}
