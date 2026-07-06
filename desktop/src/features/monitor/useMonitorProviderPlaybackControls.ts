import { useMonitorProviderPlaybackControlCallbacks } from "./useMonitorProviderPlaybackControlCallbacks";
import type { UseMonitorProviderPlaybackControlsInput } from "./monitorProviderPlaybackControlTypes";

export function useMonitorProviderPlaybackControls(input: UseMonitorProviderPlaybackControlsInput) {
  return useMonitorProviderPlaybackControlCallbacks(input);
}

export type { UseMonitorProviderPlaybackControlsInput };
