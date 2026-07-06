import type { MutableRefObject } from "react";

import type { ActiveMonitorSession } from "./monitorContextTypes";
import { replaceExistingMonitorSession } from "./monitorOrchestrationRuntime";

type SetSessionState = (value: ActiveMonitorSession | null) => void;

export async function replaceExistingMonitorSessionIfPresent(input: {
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  stopPolling: () => void;
  setSession: SetSessionState;
  stopStreamSession: (sessionId: string) => Promise<unknown>;
}): Promise<void> {
  if (!input.sessionRef.current) {
    return;
  }

  await replaceExistingMonitorSession({
    sessionRef: input.sessionRef,
    stopPolling: input.stopPolling,
    setSession: input.setSession,
    stopStreamSession: input.stopStreamSession,
  });
}
