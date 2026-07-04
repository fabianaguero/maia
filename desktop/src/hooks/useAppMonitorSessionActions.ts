import { useCallback } from "react";

import {
  type SessionMonitorDraft,
} from "../appMonitorActionsRuntime";
import {
  openCurrentMonitoredRepo,
  startLiveMonitorSession,
  startReplayMonitorSession,
} from "./appMonitorSessionActionsRuntime";
import {
  buildAppMonitorLiveActionInput,
  buildAppMonitorOpenRepoActionInput,
  buildAppMonitorReplayActionInput,
  type UseAppMonitorSessionActionsInput,
} from "./appMonitorSessionActionsHookRuntime";

export function useAppMonitorSessionActions({
  t,
  repositories,
  sessions,
  monitor,
  notify,
  setAnalysisMode,
  setScreen,
  setPillar,
  armSessionMusicalBase,
  primeMonitorGuideTrack,
}: UseAppMonitorSessionActionsInput) {
  const replayInput = buildAppMonitorReplayActionInput({
    t,
    repositories,
    sessions,
    monitor,
    notify,
    setAnalysisMode,
    setScreen,
    setPillar,
    armSessionMusicalBase,
    primeMonitorGuideTrack,
  });
  const liveInput = buildAppMonitorLiveActionInput({
    t,
    repositories,
    sessions,
    monitor,
    notify,
    setAnalysisMode,
    setScreen,
    setPillar,
    armSessionMusicalBase,
    primeMonitorGuideTrack,
  });
  const openRepoInput = buildAppMonitorOpenRepoActionInput({
    t,
    repositories,
    sessions,
    monitor,
    notify,
    setAnalysisMode,
    setScreen,
    setPillar,
    armSessionMusicalBase,
    primeMonitorGuideTrack,
  });

  const startReplaySession = useCallback(
    async (session: PersistedSession, replayWindowIndex?: number): Promise<boolean> =>
      startReplayMonitorSession(replayInput, session, replayWindowIndex),
    [replayInput],
  );

  const startLiveSession = useCallback(
    async (
      input: StartSessionInput,
      persistedSessionId: string,
      draft?: SessionMonitorDraft & { sourceId?: string | null },
    ): Promise<boolean> => startLiveMonitorSession(liveInput, input, persistedSessionId, draft),
    [liveInput],
  );

  const openMonitoredRepo = useCallback(() => openCurrentMonitoredRepo(openRepoInput), [openRepoInput]);

  return {
    startReplaySession,
    startLiveSession,
    openMonitoredRepo,
  };
}

type PersistedSession = UseAppMonitorSessionActionsInput["sessions"]["sessions"][number];
type StartSessionInput = Parameters<UseAppMonitorSessionActionsInput["monitor"]["startSession"]>[1];
