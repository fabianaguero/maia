import { useCallback } from "react";

import {
  emitMonitorProviderUpdateState,
  runMonitorProviderPollState,
} from "./monitorProviderLiveRuntime";
import {
  buildMonitorProviderEmitUpdateHookInput,
  buildMonitorProviderPollTransportHookInput,
} from "./monitorProviderPollTransportHookRuntime";
import type { UseMonitorProviderRuntimeOrchestrationInput } from "./monitorProviderRuntimeOrchestrationTypes";

export function useMonitorProviderPollTransportCallbacks(
  input: UseMonitorProviderRuntimeOrchestrationInput,
  deps: {
    schedulePoll: (doPoll: () => Promise<void>) => void;
  },
) {
  const { audio, live, logger, persistence, session, transport } = input;

  const emitUpdate = useCallback(
    (
      update: Parameters<typeof emitMonitorProviderUpdateState>[0]["update"],
      options?: {
        accumulateMetrics?: boolean;
        persistPlaybackEvent?: boolean;
      },
    ) => {
      emitMonitorProviderUpdateState(
        buildMonitorProviderEmitUpdateHookInput({
          source: input,
          update,
          options,
        }),
      );
    },
    [audio.audioContextRef, live.listenersRef, live.pollIndexRef, logger, persistence, session],
  );

  const doPoll = useCallback(async () => {
    await runMonitorProviderPollState(
      buildMonitorProviderPollTransportHookInput({
        source: input,
        emitUpdate,
        schedulePoll: deps.schedulePoll,
        doPoll,
      }),
    );
  }, [
    deps.schedulePoll,
    emitUpdate,
    live.activeRef,
    live.directCursorRef,
    live.emptyWindowsRef,
    live.httpUrlRef,
    live.wsLineBufferRef,
    logger,
    session.sessionRef,
    transport,
  ]);

  return {
    emitUpdate,
    doPoll,
  };
}
