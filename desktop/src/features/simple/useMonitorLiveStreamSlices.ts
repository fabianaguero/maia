import type { UseMonitorLiveStreamOptions } from "./monitorLiveStreamHookTypes";
import { useMonitorLiveStreamControllerState } from "./useMonitorLiveStreamControllerState";
import { useMonitorLiveStreamRuntimeEffects } from "./useMonitorLiveStreamRuntimeEffects";

export function useMonitorLiveStreamSlices(input: UseMonitorLiveStreamOptions) {
  const stateController = useMonitorLiveStreamControllerState({
    maxLiveLines: input.maxLiveLines,
  });

  const controllerState = input;

  useMonitorLiveStreamRuntimeEffects({
    state: controllerState,
    refs: stateController.refs,
    setters: stateController.setters,
  });

  return {
    stateController,
    controllerState,
  };
}
