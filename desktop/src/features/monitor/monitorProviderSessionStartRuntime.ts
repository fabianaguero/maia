import type { MutableRefObject } from "react";

import type { RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
import type { ActiveMonitorSession } from "./monitorContextTypes";
import {
  buildMonitorProviderLiveStartBaseInput,
  buildMonitorProviderLiveStartState,
  type MonitorProviderLiveStartBaseInput,
  type MonitorProviderLiveStartSharedInput,
} from "./monitorProviderStartRuntime";
import { createLiveMonitorSession } from "./monitorSessionRuntime";
import {
  FILE_ONLY_MONITORING_ERROR,
  type MonitorProviderSessionLogger,
} from "./monitorProviderSessionTypes";

type LiveStartInput = Omit<MonitorProviderLiveStartBaseInput, never>;

function isSessionBackedMonitoringAdapter(adapterKind: StartSessionInput["adapterKind"]): boolean {
  return adapterKind === "file" || adapterKind === "sonarqube";
}

export async function startMonitorProviderSessionState(input: {
  repo: RepositoryAnalysis;
  sessionInput: StartSessionInput;
  persistedSessionId?: string;
  sessionRef: MutableRefObject<ActiveMonitorSession | null>;
  replaceExistingSessionIfPresent: () => Promise<void>;
  resolveLiveMonitorPollMode: (input: {
    sessionInput: StartSessionInput;
  }) => Promise<ActiveMonitorSession["pollMode"]>;
  startLiveMonitorSession: (input: MonitorProviderLiveStartSharedInput) => Promise<void>;
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

  if (!isSessionBackedMonitoringAdapter(input.sessionInput.adapterKind)) {
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
