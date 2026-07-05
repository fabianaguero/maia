import { useSimpleMonitorDeckVisualState } from "./useSimpleMonitorDeckVisualState";
import { useSimpleMonitorLiveTail } from "./useSimpleMonitorLiveTail";
import { buildSimpleMonitorDeckPresentationVisualHookArgs } from "./simpleMonitorDeckPresentationHookRuntime";
import {
  buildSimpleMonitorDeckVisualHookInput,
  buildSimpleMonitorLiveTailHookInput,
} from "./simpleMonitorDeckPresentationRuntime";
import type { UseSimpleMonitorDeckPresentationStateInput } from "./simpleMonitorDeckPresentationTypes";

export function useSimpleMonitorDeckPresentationState(
  input: UseSimpleMonitorDeckPresentationStateInput,
) {
  const tailState = useSimpleMonitorLiveTail(
    buildSimpleMonitorLiveTailHookInput({
      liveLines: input.liveLines,
      selectedAnomalyId: input.selectedAnomalyId,
      setSelectedAnomalyId: input.setSelectedAnomalyId,
    }),
  );
  const visualState = useSimpleMonitorDeckVisualState(
    buildSimpleMonitorDeckVisualHookInput({
      ...buildSimpleMonitorDeckPresentationVisualHookArgs({
        state: input,
        focusAnomaly: tailState.focusAnomaly,
      }),
    }),
  );

  return {
    ...tailState,
    ...visualState,
  };
}
