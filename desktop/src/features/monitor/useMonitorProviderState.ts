import type {
  UseMonitorProviderStateInput,
  UseMonitorProviderStateResult,
} from "./monitorProviderStateTypes";
import { useMonitorProviderObservableState } from "./useMonitorProviderObservableState";
import { useMonitorProviderRefs } from "./useMonitorProviderRefs";

export function useMonitorProviderState(
  input: UseMonitorProviderStateInput,
): UseMonitorProviderStateResult {
  const observableState = useMonitorProviderObservableState(input);
  const refs = useMonitorProviderRefs(input);

  return {
    ...observableState,
    ...refs,
  };
}
