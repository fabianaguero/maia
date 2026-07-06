import type { UseMonitorProviderPlaybackControlsInput } from "./monitorProviderPlaybackControlTypes";
import { useMonitorProviderPlaybackSeekCallbacks } from "./useMonitorProviderPlaybackSeekCallbacks";
import { useMonitorProviderPlaybackTransportCallbacks } from "./useMonitorProviderPlaybackTransportCallbacks";

export function useMonitorProviderPlaybackControlCallbacks(
  input: UseMonitorProviderPlaybackControlsInput,
) {
  const { seekPlaybackProgress, seekPlaybackWindow } =
    useMonitorProviderPlaybackSeekCallbacks(input);
  const { pausePlayback, resumePlayback, stepPlaybackWindow } =
    useMonitorProviderPlaybackTransportCallbacks(input);

  return {
    seekPlaybackProgress,
    seekPlaybackWindow,
    pausePlayback,
    resumePlayback,
    stepPlaybackWindow,
  };
}
