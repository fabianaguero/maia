import type { RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput, StreamSessionRecord } from "../../types/monitor";
import {
  resolveLiveMonitorPollMode,
  startLiveMonitorSessionState,
} from "./monitorLiveLifecycleRuntime";
import {
  type attachMonitorProviderSessionState,
  type startMonitorProviderSessionState,
} from "./monitorProviderSessionRuntime";
import type { UseMonitorProviderSessionActionsInput } from "./monitorProviderSessionActionTypes";

export function buildStartMonitorProviderSessionActionInput(input: {
  dependencies: Pick<
    UseMonitorProviderSessionActionsInput,
    "session" | "runtime" | "api" | "logger"
  >;
  repo: RepositoryAnalysis;
  sessionInput: StartSessionInput;
  persistedSessionId?: string;
  replaceExistingSessionIfPresent: () => Promise<void>;
}): Parameters<typeof startMonitorProviderSessionState>[0] {
  const { dependencies } = input;

  return {
    repo: input.repo,
    sessionInput: input.sessionInput,
    persistedSessionId: input.persistedSessionId,
    sessionRef: dependencies.session.sessionRef,
    replaceExistingSessionIfPresent: input.replaceExistingSessionIfPresent,
    resolveLiveMonitorPollMode: async ({ sessionInput: nextInput }) =>
      resolveLiveMonitorPollMode({
        sessionInput: nextInput,
        startStreamSession: dependencies.api.startStreamSession,
      }),
    startLiveMonitorSession: startLiveMonitorSessionState,
    liveStartInput: dependencies.runtime.buildLiveStartInput("session-start", true),
    logger: dependencies.logger,
  };
}

export function buildAttachMonitorProviderSessionActionInput(input: {
  dependencies: Pick<UseMonitorProviderSessionActionsInput, "session" | "runtime" | "logger">;
  sessionRecord: StreamSessionRecord;
  repoId: string;
  repoTitle: string;
  trackId?: string;
  trackTitle?: string;
  sourceTemplateId?: string | null;
  persistedSessionId?: string | null;
  replaceExistingSessionIfPresent: () => Promise<void>;
}): Parameters<typeof attachMonitorProviderSessionState>[0] {
  const { dependencies } = input;

  return {
    sessionRecord: input.sessionRecord,
    repoId: input.repoId,
    repoTitle: input.repoTitle,
    trackId: input.trackId,
    trackTitle: input.trackTitle,
    sourceTemplateId: input.sourceTemplateId ?? null,
    persistedSessionId: input.persistedSessionId,
    sessionRef: dependencies.session.sessionRef,
    replaceExistingSessionIfPresent: input.replaceExistingSessionIfPresent,
    startLiveMonitorSession: startLiveMonitorSessionState,
    liveStartInput: dependencies.runtime.buildLiveStartInput("attach-session", false),
    logger: dependencies.logger,
  };
}
