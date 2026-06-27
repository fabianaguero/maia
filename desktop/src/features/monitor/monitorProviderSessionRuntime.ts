import type { MutableRefObject } from "react";

import type { RepositoryAnalysis } from "../../types/library";
import type {
  StartSessionInput,
  StreamSessionRecord,
} from "../../types/monitor";
import type { ActiveMonitorSession } from "./monitorContextTypes";
import {
  buildMonitorProviderLiveStartBaseInput,
  buildMonitorProviderLiveStartState,
  type MonitorProviderLiveStartBaseInput,
  type MonitorProviderLiveStartSharedInput,
} from "./monitorProviderStartRuntime";
import type { MonitorLiveLifecycleLogger } from "./monitorLiveLifecycleRuntime";
import {
  createActiveMonitorSession,
  createLiveMonitorSession,
} from "./monitorSessionRuntime";

export const FILE_ONLY_MONITORING_ERROR =
  "Week 1 MVP only supports file-backed log monitoring. Use an imported log file as the live source.";

export type MonitorProviderSessionLogger = Pick<MonitorLiveLifecycleLogger, "info">;

type LiveStartInput = Omit<
  MonitorProviderLiveStartBaseInput,
  never
>;

export async function startMonitorProviderSessionState(input: {
  repo: RepositoryAnalysis;
  sessionInput: StartSessionInput;
  persistedSessionId?: string;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  replaceExistingSessionIfPresent: () => Promise<void>;
  resolveLiveMonitorPollMode: (input: {
    sessionInput: StartSessionInput;
  }) => Promise<ActiveMonitorSession["pollMode"]>;
  startLiveMonitorSession: (
    input: MonitorProviderLiveStartSharedInput,
  ) => Promise<void>;
  liveStartInput: LiveStartInput;
  logger: MonitorProviderSessionLogger;
}): Promise<boolean> {
  input.logger.info(
    "startSession id=%s adapter=%s source=%s persistedId=%s",
    input.sessionInput.sessionId,
    input.sessionInput.adapterKind,
    input.sessionInput.source,
    input.persistedSessionId,
  );

  if (input.sessionInput.adapterKind !== "file") {
    throw new Error(FILE_ONLY_MONITORING_ERROR);
  }

  if (input.sessionRef.current) {
    input.logger.info(
      "startSession — stopping previous session id=%s",
      input.sessionRef.current.sessionId,
    );
    await input.replaceExistingSessionIfPresent();
  }

  const pollMode = await input.resolveLiveMonitorPollMode({
    sessionInput: input.sessionInput,
  });

  const session = createLiveMonitorSession({
    repo: input.repo,
    sessionInput: input.sessionInput,
    pollMode,
    persistedSessionId: input.persistedSessionId,
  });

  await input.startLiveMonitorSession(
    buildMonitorProviderLiveStartState({
      ...buildMonitorProviderLiveStartBaseInput(input.liveStartInput),
      session,
      sourceTemplateId: input.sessionInput.sourceTemplateId ?? null,
      persistedSessionId: input.persistedSessionId,
      startFromBeginning:
        input.sessionInput.adapterKind === "file" && input.sessionInput.startFromBeginning,
      logger: input.logger,
      logLabel: "startSession",
    }),
  );

  input.logger.info(
    "session started id=%s mode=%s adapter=%s path=%s",
    session.sessionId,
    pollMode,
    input.sessionInput.adapterKind,
    session.sourcePath,
  );

  return true;
}

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
  startLiveMonitorSession: (
    input: MonitorProviderLiveStartSharedInput,
  ) => Promise<void>;
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
