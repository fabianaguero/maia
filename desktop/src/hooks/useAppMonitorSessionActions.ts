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
import {
  buildAppMonitorLiveActionInput,
  buildAppMonitorOpenRepoActionInput,
  buildAppMonitorReplayActionInput,
  buildReplaySourceRepositoryId,
  shouldSeekReplayWindow,
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
    async (session: PersistedSession, replayWindowIndex?: number): Promise<boolean> => {
      replayInput.sessions.setSelectedSessionId(session.id);
      const draft = resolveReplayMonitorDraft(session);
      replayInput.armSessionMusicalBase(draft);
      replayInput.primeMonitorGuideTrack(draft);

      const sourceRepository = resolveReplaySourceRepository(
        session,
        replayInput.repositories.repositories,
      );

      if (!sourceRepository) {
        replayInput.notify(
          "error",
          replayInput.t.appShell.replayUnavailableTitle,
          replayInput.t.appShell.replayUnavailableBody,
        );
        return false;
      }

      replayInput.repositories.setSelectedRepositoryId(sourceRepository.id);
      replayInput.setAnalysisMode("repo");

      const alreadyActiveReplay = shouldReuseActiveReplaySession({
        currentPersistedSessionId: replayInput.monitor.session?.persistedSessionId,
        isPlayback: replayInput.monitor.isPlayback,
        replaySessionId: session.id,
      });

      const ok = alreadyActiveReplay
        ? true
        : await replayInput.monitor.playbackSession(
            buildReplayPlaybackInput({
              session,
              repoId: buildReplaySourceRepositoryId(sourceRepository, session),
              unnamedSessionLabel: replayInput.t.session.unnamedSession,
            }),
          );

      if (!ok) {
        return false;
      }

      if (shouldSeekReplayWindow(replayWindowIndex)) {
        replayInput.monitor.pausePlayback();
        replayInput.monitor.seekPlaybackWindow(replayWindowIndex);
      }

      replayInput.setAnalysisMode("repo");
      replayInput.setScreen("inspect");
      return true;
    },
    [
      replayInput,
    ],
  );

  const startLiveSession = useCallback(
    async (
      input: StartSessionInput,
      persistedSessionId: string,
      draft?: SessionMonitorDraft & { sourceId?: string | null },
    ): Promise<boolean> => {
      liveInput.sessions.clearError();
      const guideDraft = buildLiveSessionGuideDraft(draft);
      liveInput.armSessionMusicalBase(guideDraft);
      liveInput.primeMonitorGuideTrack(guideDraft);

      const success = await liveInput.monitor.startSession(
        resolveSessionRepository({
          adapterKind: input.adapterKind,
          label: input.label ?? liveInput.t.session.unnamedSession,
          nowIso: new Date().toISOString(),
          repositories: liveInput.repositories.repositories,
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
        sessions: liveInput.sessions.sessions,
        persistedSessionId,
      });

      if (persistenceAction === "create") {
        await liveInput.sessions.createSession(
          buildLiveSessionPersistenceInput({
            sessionId: persistedSessionId,
            startInput: input,
            draft,
          }),
        );
      } else {
        liveInput.sessions.setSelectedSessionId(persistedSessionId);
      }

      return true;
    },
    [
      liveInput,
    ],
  );

  const openMonitoredRepo = useCallback(() => {
    const repo = resolveMonitoredRepository(
      openRepoInput.monitor.session,
      openRepoInput.repositories.repositories,
    );
    if (!repo) {
      return;
    }

    const navigation = buildMonitoredRepoNavigation();
    openRepoInput.repositories.setSelectedRepositoryId(repo.id);
    openRepoInput.setAnalysisMode(navigation.analysisMode);
    openRepoInput.setScreen(navigation.screen);
    openRepoInput.setPillar(navigation.pillar);
  }, [openRepoInput]);

  return {
    startReplaySession,
    startLiveSession,
    openMonitoredRepo,
  };
}

type PersistedSession = UseAppMonitorSessionActionsInput["sessions"]["sessions"][number];
type StartSessionInput = Parameters<UseAppMonitorSessionActionsInput["monitor"]["startSession"]>[1];
