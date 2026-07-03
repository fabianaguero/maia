import { useCallback } from "react";

import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";
import { stopMonitorProviderSessionAction } from "./monitorProviderSessionActionRuntime";

export function useMonitorProviderSessionStopCallback(
  input: UseMonitorProviderSessionActionsInput,
) {
  const { api, audio, live, logger, runtime, session } = input;

  const stopSession = useCallback(
    async (): Promise<void> =>
      stopMonitorProviderSessionAction({
        session,
        audio,
        live,
        runtime,
        api,
        logger,
      }),
    [
      api.stopStreamSession,
      api.updatePersistedSessionStatus,
      audio.audioContextRef,
      audio.currentSegmentRef,
      live.activeRef,
      live.directCursorRef,
      live.emptyWindowsRef,
      live.isPlaybackRef,
      logger,
      runtime.resetReplayTelemetry,
      runtime.stopPolling,
      session.isPlayback,
      session.sessionRef,
      session.setIsPlayback,
      session.setMetrics,
      session.setSession,
    ],
  );

  return {
    stopSession,
  };
}
