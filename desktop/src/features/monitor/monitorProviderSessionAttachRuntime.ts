import type { MutableRefObject } from "react";

import type { StreamSessionRecord } from "../../types/monitor";
import type { ActiveMonitorSession } from "./monitorContextTypes";
import {
  buildMonitorProviderLiveStartBaseInput,
  buildMonitorProviderLiveStartState,
  type MonitorProviderLiveStartBaseInput,
  type MonitorProviderLiveStartSharedInput,
} from "./monitorProviderStartRuntime";
import { createActiveMonitorSession } from "./monitorSessionRuntime";
import type { MonitorProviderSessionLogger } from "./monitorProviderSessionTypes";

type LiveStartInput = Omit<MonitorProviderLiveStartBaseInput, never>;

export async function attachMonitorProviderSessionState(input: {
  sessionRecord: StreamSessionRecord;
  repoId: string;
  repoTitle: string;
  trackId?: string;
  trackTitle?: string;
  sourceTemplateId?: string | null;
  persistedSessionId?: string | null;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  replaceExistingSessionIfPresent: () => Promise<void>;
  startLiveMonitorSession: (input: MonitorProviderLiveStartSharedInput) => Promise<void>;
  liveStartInput: LiveStartInput;
  logger?: MonitorProviderSessionLogger;
}): Promise<boolean> {
  input.logger?.info(
    "attachSession id=%s adapter=%s source=%s",
    input.sessionRecord.sessionId,
    input.sessionRecord.adapterKind,
    input.sessionRecord.source,
  );

  if (input.sessionRef.current) {
    await input.replaceExistingSessionIfPresent();
  }

  const session = createActiveMonitorSession({
    sessionId: input.sessionRecord.sessionId,
    persistedSessionId: input.persistedSessionId,
    repoId: input.repoId,
    repoTitle: input.repoTitle,
    trackId: input.trackId,
    trackTitle: input.trackTitle,
    sourcePath: input.sessionRecord.source,
    adapterKind: input.sessionRecord.adapterKind,
    pollMode: "session",
  });

  await input.startLiveMonitorSession(
    buildMonitorProviderLiveStartState({
      ...buildMonitorProviderLiveStartBaseInput(input.liveStartInput),
      session,
      sourceTemplateId: input.sourceTemplateId ?? null,
      persistedSessionId: input.persistedSessionId,
    }),
  );

  return true;
}
