import { useCallback } from "react";

import type { PlaybackSessionSelection } from "./monitorPlaybackRuntime";
import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";
import { startMonitorProviderPlaybackSessionAction } from "./monitorProviderSessionActionRuntime";

export function useMonitorProviderSessionPlaybackCallbacks(
  input: UseMonitorProviderSessionActionsInput,
) {
  const playbackSession = useCallback(
    async (selection: PlaybackSessionSelection): Promise<boolean> =>
      startMonitorProviderPlaybackSessionAction({
        selection,
        dependencies: input,
        setTimeoutFn: window.setTimeout,
      }),
    [input],
  );

  return {
    playbackSession,
  };
}
