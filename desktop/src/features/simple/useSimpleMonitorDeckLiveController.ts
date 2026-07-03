import { buildSimpleMonitorDeckLiveControllerHookResult } from "./simpleMonitorDeckLiveControllerHookRuntime";
import type {
  SimpleMonitorDeckLiveControllerResult,
  UseSimpleMonitorDeckLiveControllerInput,
} from "./simpleMonitorDeckLiveControllerTypes";
import { useSimpleMonitorDeckLiveControllerSlices } from "./useSimpleMonitorDeckLiveControllerSlices";

export function useSimpleMonitorDeckLiveController(
  input: UseSimpleMonitorDeckLiveControllerInput,
): SimpleMonitorDeckLiveControllerResult {
  const { trackAudio, liveState } = useSimpleMonitorDeckLiveControllerSlices(input);

  return buildSimpleMonitorDeckLiveControllerHookResult({
    trackAudio,
    liveState,
  });
}
