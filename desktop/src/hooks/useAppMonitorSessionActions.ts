import { useCallback } from "react";

import { resolveReplaySourceRepository, shouldReuseActiveReplaySession } from "../appRuntime";
import {
  resolveMonitoredRepository,
  resolveReplayMonitorDraft,
  resolveSessionPersistenceAction,
  type SessionMonitorDraft,
} from "../appMonitorActionsRuntime";
import { resolveSessionRepository } from "../appContentRuntime";
import {
  buildLiveSessionGuideDraft,
  buildLiveSessionPersistenceInput,
  buildMonitoredRepoNavigation,
  buildReplayPlaybackInput,
} from "./appMonitorSessionActionsRuntime";
import type { UseAppMonitorActionsInput } from "./appMonitorActionsTypes";

interface MonitorGuideActions {
  armSessionMusicalBase: (draft?: SessionMonitorDraft) => void;
  primeMonitorGuideTrack: (draft?: SessionMonitorDraft) => void;
}

type SessionActionsInput = Pick<
  UseAppMonitorActionsInput,
  | "t"
  | "repositories"
  | "sessions"
  | "monitor"
  | "notify"
  | "setAnalysisMode"
  | "setScreen"
  | "setPillar"
> &
  MonitorGuideActions;

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
}: SessionActionsInput) {
  const startReplaySession = useCallback(
    async (session: PersistedSession, replayWindowIndex?: number): Promise<boolean> => {
      sessions.setSelectedSessionId(session.id);
      const draft = resolveReplayMonitorDraft(session);
      armSessionMusicalBase(draft);
      primeMonitorGuideTrack(draft);

      const sourceRepository = resolveReplaySourceRepository(session, repositories.repositories);

      if (!sourceRepository) {
        notify("error", t.appShell.replayUnavailableTitle, t.appShell.replayUnavailableBody);
        return false;
      }

      repositories.setSelectedRepositoryId(sourceRepository.id);
      setAnalysisMode("repo");

      const alreadyActiveReplay = shouldReuseActiveReplaySession({
        currentPersistedSessionId: monitor.session?.persistedSessionId,
        isPlayback: monitor.isPlayback,
        replaySessionId: session.id,
      });

      const ok = alreadyActiveReplay
        ? true
        : await monitor.playbackSession(
            buildReplayPlaybackInput({
              session,
              repoId: sourceRepository.id ?? session.sourceId,
              unnamedSessionLabel: t.session.unnamedSession,
            }),
          );

      if (!ok) {
        return false;
      }

      if (typeof replayWindowIndex === "number") {
        monitor.pausePlayback();
        monitor.seekPlaybackWindow(replayWindowIndex);
      }

      setAnalysisMode("repo");
      setScreen("inspect");
      return true;
    },
    [
      armSessionMusicalBase,
      monitor,
      notify,
      primeMonitorGuideTrack,
      repositories,
      sessions,
      setAnalysisMode,
      setScreen,
      t,
    ],
  );

  const startLiveSession = useCallback(
    async (
      input: StartSessionInput,
      persistedSessionId: string,
      draft?: SessionMonitorDraft & { sourceId?: string | null },
    ): Promise<boolean> => {
      sessions.clearError();
      const guideDraft = buildLiveSessionGuideDraft(draft);
      armSessionMusicalBase(guideDraft);
      primeMonitorGuideTrack(guideDraft);

      const success = await monitor.startSession(
        resolveSessionRepository({
          adapterKind: input.adapterKind,
          label: input.label ?? t.session.unnamedSession,
          nowIso: new Date().toISOString(),
          repositories: repositories.repositories,
          sessionId: input.sessionId,
          source: input.source,
        }),
        input,
        persistedSessionId,
      );

      if (!success) {
        return false;
      }

      const persistenceAction = resolveSessionPersistenceAction({
        sessions: sessions.sessions,
        persistedSessionId,
      });

      if (persistenceAction === "create") {
        await sessions.createSession(
          buildLiveSessionPersistenceInput({
            sessionId: persistedSessionId,
            startInput: input,
            draft,
          }),
        );
      } else {
        sessions.setSelectedSessionId(persistedSessionId);
      }

      return true;
    },
    [
      armSessionMusicalBase,
      monitor,
      primeMonitorGuideTrack,
      repositories.repositories,
      sessions,
      t.session.unnamedSession,
    ],
  );

  const openMonitoredRepo = useCallback(() => {
    const repo = resolveMonitoredRepository(monitor.session, repositories.repositories);
    if (!repo) {
      return;
    }

    const navigation = buildMonitoredRepoNavigation();
    repositories.setSelectedRepositoryId(repo.id);
    setAnalysisMode(navigation.analysisMode);
    setScreen(navigation.screen);
    setPillar(navigation.pillar);
  }, [monitor.session, repositories, setAnalysisMode, setPillar, setScreen]);

  return {
    startReplaySession,
    startLiveSession,
    openMonitoredRepo,
  };
}

type PersistedSession = UseAppMonitorActionsInput["sessions"]["sessions"][number];
type StartSessionInput = Parameters<UseAppMonitorActionsInput["monitor"]["startSession"]>[1];
