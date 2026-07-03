import { replaceExistingMonitorSessionIfPresent } from "./monitorProviderStartRuntime";
import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";

export function buildReplaceExistingMonitorProviderSessionInput(
  input: Pick<UseMonitorProviderSessionActionsInput, "session" | "runtime" | "api">,
): Parameters<typeof replaceExistingMonitorSessionIfPresent>[0] {
  return {
    sessionRef: input.session.sessionRef,
    setSession: input.session.setSession,
    stopPolling: input.runtime.stopPolling,
    stopStreamSession: input.api.stopStreamSession,
  };
}
