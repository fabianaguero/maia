import { useCallback, useMemo } from "react";

import type { RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
import type {
  MonitorProviderAttachSessionSelection,
  UseMonitorProviderSessionActionsInput,
} from "./monitorProviderSessionActionTypes";
import { buildMonitorProviderSessionLiveCallbacksInput } from "./monitorProviderSessionActionsHookRuntime";
import {
  attachMonitorProviderSessionAction,
  replaceExistingMonitorProviderSessionState,
  startMonitorProviderSessionAction,
} from "./monitorProviderSessionActionRuntime";

export function useMonitorProviderSessionLiveCallbacks(
  input: UseMonitorProviderSessionActionsInput,
) {
  const dependencies = useMemo(() => buildMonitorProviderSessionLiveCallbacksInput(input), [input]);

  const replaceExistingSessionIfPresent = useCallback(async () => {
    await replaceExistingMonitorProviderSessionState(dependencies);
  }, [dependencies]);

  const startSession = useCallback(
    async (
      repo: RepositoryAnalysis,
      sessionInput: StartSessionInput,
      persistedSessionId?: string,
    ): Promise<boolean> =>
      startMonitorProviderSessionAction({
        dependencies,
        repo,
        sessionInput,
        persistedSessionId,
        replaceExistingSessionIfPresent,
      }),
    [dependencies, replaceExistingSessionIfPresent],
  );

  const attachSession = useCallback(
    async (selection: MonitorProviderAttachSessionSelection): Promise<boolean> =>
      attachMonitorProviderSessionAction({
        dependencies,
        selection,
        replaceExistingSessionIfPresent,
      }),
    [dependencies, replaceExistingSessionIfPresent],
  );

  return {
    replaceExistingSessionIfPresent,
    startSession,
    attachSession,
  };
}
