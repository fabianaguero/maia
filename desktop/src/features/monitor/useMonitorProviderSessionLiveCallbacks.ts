import { useCallback } from "react";

import type { RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
import type {
  MonitorProviderAttachSessionSelection,
  UseMonitorProviderSessionActionsInput,
} from "./monitorProviderSessionActionTypes";
import {
  attachMonitorProviderSessionAction,
  replaceExistingMonitorProviderSessionState,
  startMonitorProviderSessionAction,
} from "./monitorProviderSessionActionRuntime";

export function useMonitorProviderSessionLiveCallbacks(
  input: UseMonitorProviderSessionActionsInput,
) {
  const { api, logger, runtime, session } = input;

  const replaceExistingSessionIfPresent = useCallback(async () => {
    await replaceExistingMonitorProviderSessionState({ session, runtime, api });
  }, [api.stopStreamSession, runtime.stopPolling, session.sessionRef, session.setSession]);

  const startSession = useCallback(
    async (
      repo: RepositoryAnalysis,
      sessionInput: StartSessionInput,
      persistedSessionId?: string,
    ): Promise<boolean> =>
      startMonitorProviderSessionAction({
        dependencies: {
          session,
          runtime,
          api,
          logger,
        },
        repo,
        sessionInput,
        persistedSessionId,
        replaceExistingSessionIfPresent,
      }),
    [
      api.startStreamSession,
      logger,
      replaceExistingSessionIfPresent,
      runtime.buildLiveStartInput,
      session.sessionRef,
    ],
  );

  const attachSession = useCallback(
    async (selection: MonitorProviderAttachSessionSelection): Promise<boolean> =>
      attachMonitorProviderSessionAction({
        dependencies: {
          session,
          runtime,
          logger,
        },
        selection,
        replaceExistingSessionIfPresent,
      }),
    [logger, replaceExistingSessionIfPresent, runtime.buildLiveStartInput, session.sessionRef],
  );

  return {
    replaceExistingSessionIfPresent,
    startSession,
    attachSession,
  };
}
