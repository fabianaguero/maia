import type { PersistedSession } from "../api/sessions";
import type { SessionMonitorDraft } from "../appMonitorActionsRuntime";
import type {
  AppMonitorLiveActionInput,
  AppMonitorOpenRepoActionInput,
  AppMonitorReplayActionInput,
} from "./appMonitorSessionActionsHookRuntime";
import {
  openCurrentMonitoredRepo,
  startLiveMonitorSession,
  startReplayMonitorSession,
} from "./appMonitorSessionActionsRuntime";

export interface AppMonitorSessionActionRunners {
  startReplaySession: (session: PersistedSession, replayWindowIndex?: number) => Promise<boolean>;
  startLiveSession: (
    input: Parameters<AppMonitorLiveActionInput["monitor"]["startSession"]>[1],
    persistedSessionId: string,
    draft?: SessionMonitorDraft & { sourceId?: string | null },
  ) => Promise<boolean>;
  openMonitoredRepo: () => void;
}

export interface BuildAppMonitorSessionActionRunnersInput {
  replayInput: AppMonitorReplayActionInput;
  liveInput: AppMonitorLiveActionInput;
  openRepoInput: AppMonitorOpenRepoActionInput;
}

export function buildAppMonitorSessionActionRunners(
  input: BuildAppMonitorSessionActionRunnersInput,
): AppMonitorSessionActionRunners {
  return {
    startReplaySession: (session, replayWindowIndex) =>
      startReplayMonitorSession(input.replayInput, session, replayWindowIndex),
    startLiveSession: (startInput, persistedSessionId, draft) =>
      startLiveMonitorSession(input.liveInput, startInput, persistedSessionId, draft),
    openMonitoredRepo: () => openCurrentMonitoredRepo(input.openRepoInput),
  };
}
