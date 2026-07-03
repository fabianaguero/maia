import type {
  UseMonitorProviderSessionActionsInput,
  UseMonitorProviderSessionActionsResult,
} from "./monitorProviderSessionActionTypes";
import { useMonitorProviderSessionLiveCallbacks } from "./useMonitorProviderSessionLiveCallbacks";
import { useMonitorProviderSessionPlaybackCallbacks } from "./useMonitorProviderSessionPlaybackCallbacks";
import { useMonitorProviderSessionStopCallback } from "./useMonitorProviderSessionStopCallback";

export function useMonitorProviderSessionActions(
  input: UseMonitorProviderSessionActionsInput,
): UseMonitorProviderSessionActionsResult {
  const { replaceExistingSessionIfPresent, startSession, attachSession } =
    useMonitorProviderSessionLiveCallbacks(input);
  const { playbackSession } = useMonitorProviderSessionPlaybackCallbacks(input);
  const { stopSession } = useMonitorProviderSessionStopCallback(input);

  return {
    replaceExistingSessionIfPresent,
    startSession,
    attachSession,
    playbackSession,
    stopSession,
  };
}
