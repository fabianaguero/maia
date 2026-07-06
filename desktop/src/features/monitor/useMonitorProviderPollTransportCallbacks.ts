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
  const { schedulePoll } = deps;

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
          audio,
          live,
          logger,
          persistence,
          session,
          update,
          options,
        }),
      );
    },
    [audio, live, logger, persistence, session],
  );

  const doPoll = useCallback(async () => {
    await runMonitorProviderPollState(
      buildMonitorProviderPollTransportHookInput({
        live,
        logger,
        session,
        transport,
        emitUpdate,
        schedulePoll,
        doPoll,
      }),
    );
  }, [emitUpdate, live, logger, schedulePoll, session, transport]);

  return {
    emitUpdate,
    doPoll,
  };
}
