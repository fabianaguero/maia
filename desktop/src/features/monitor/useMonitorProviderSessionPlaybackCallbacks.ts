import { useCallback, useMemo } from "react";

import type { PlaybackSessionSelection } from "./monitorPlaybackRuntime";
import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";
import { buildMonitorProviderSessionPlaybackCallbacksInput } from "./monitorProviderSessionActionsHookRuntime";
import { startMonitorProviderPlaybackSessionAction } from "./monitorProviderSessionActionRuntime";

export function useMonitorProviderSessionPlaybackCallbacks(
  input: UseMonitorProviderSessionActionsInput,
) {
  const dependencies = useMemo(
    () => buildMonitorProviderSessionPlaybackCallbacksInput(input),
    [input],
  );
  const playbackSession = useCallback(
    async (selection: PlaybackSessionSelection): Promise<boolean> =>
      startMonitorProviderPlaybackSessionAction({
        selection,
        dependencies,
        setTimeoutFn: window.setTimeout,
      }),
    [dependencies],
  );

  return {
    playbackSession,
  };
}
