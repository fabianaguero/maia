import { useCallback } from "react";

import type { PersistedSession } from "../../api/sessions";
import type { AppTranslations } from "../../i18n/en";
import type { RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import {
  createDirectSessionStartPlan,
  createResumeSessionPlan,
  createSessionStartPlan,
  createSessionTimestampId,
  resolveReplayBookmarkError,
  resolveReplaySessionError,
  resolveReplaySessionFailure,
  type SessionStartDraft,
} from "./sessionScreenRuntime";

interface UseSessionScreenActionsInput {
  t: AppTranslations;
  baseMode: SessionBaseMode;
  mode: QuickSessionMode;
  repositories: RepositoryAnalysis[];
  sessions: PersistedSession[];
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  sessionLabel: string;
  directPath: string;
  onStartSession: (
    input: StartSessionInput,
    persistedSessionId: string,
    draft?: SessionStartDraft,
  ) => Promise<boolean>;
  onResume: (sessionId: string) => void;
  onPlayback: (session: PersistedSession) => Promise<boolean>;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<boolean>;
  onSelectSession: (sessionId: string) => void;
  setCreateError: (value: string | null) => void;
  setCreating: (value: boolean) => void;
  setIsDirectLoading: (value: boolean) => void;
  setSessionLabel: (value: string) => void;
  setSelectedSourceId: (value: string | null) => void;
  setSelectedTrackId: (value: string | null) => void;
  setSelectedPlaylistId: (value: string | null) => void;
  setDirectPath: (value: string) => void;
}

export function useSessionScreenActions(input: UseSessionScreenActionsInput) {
  const handleCreateSession = useCallback(async () => {
    try {
      input.setCreateError(null);
      input.setCreating(true);
      const plan = createSessionStartPlan(
        {
          baseMode: input.baseMode,
          mode: input.mode,
          repositories: input.repositories,
          selectedPlaylistId: input.selectedPlaylistId,
          selectedSourceId: input.selectedSourceId,
          selectedTrackId: input.selectedTrackId,
          sessionLabel: input.sessionLabel,
        },
        input.t,
        () => createSessionTimestampId("session"),
      );

      if (plan.error || !plan.input || !plan.sessionId) {
        if (plan.error) {
          input.setCreateError(plan.error);
        }
        return;
      }

      const success = await input.onStartSession(plan.input, plan.sessionId, plan.draft);
      if (success) {
        input.setSessionLabel("");
        input.setSelectedSourceId(null);
        input.setSelectedTrackId(null);
        input.setSelectedPlaylistId(null);
      }
    } catch (error) {
      input.setCreateError(
        error instanceof Error ? error.message : input.t.session.failedCreateSession,
      );
    } finally {
      input.setCreating(false);
    }
  }, [input]);

  const handleDirectLaunch = useCallback(async () => {
    if (!input.directPath.trim()) {
      return;
    }

    try {
      input.setIsDirectLoading(true);
      input.setCreateError(null);
      const plan = createDirectSessionStartPlan(
        {
          directPath: input.directPath,
          selectedPlaylistId: input.selectedPlaylistId,
          selectedTrackId: input.selectedTrackId,
        },
        input.t,
        () => createSessionTimestampId("direct"),
      );

      if (!plan.input || !plan.sessionId) {
        return;
      }

      const success = await input.onStartSession(plan.input, plan.sessionId, plan.draft);
      if (success) {
        input.setDirectPath("");
      }
    } catch (error) {
      input.setCreateError(
        error instanceof Error ? error.message : input.t.session.failedCreateSession,
      );
    } finally {
      input.setIsDirectLoading(false);
    }
  }, [input]);

  const handleResumeSession = useCallback(
    async (sessionId: string) => {
      try {
        input.setCreateError(null);
        const plan = createResumeSessionPlan(
          sessionId,
          input.sessions,
          input.repositories,
          input.t,
        );
        if (!plan.input || !plan.sessionId) {
          if (plan.error) {
            input.setCreateError(plan.error);
          }
          return;
        }

        const success = await input.onStartSession(plan.input, plan.sessionId, plan.draft);
        if (success) {
          input.onResume(sessionId);
          input.onSelectSession(sessionId);
        }
      } catch (error) {
        input.setCreateError(
          error instanceof Error ? error.message : input.t.session.failedResumeSession,
        );
      }
    },
    [input],
  );

  const handlePlaybackSession = useCallback(
    async (session: PersistedSession) => {
      input.setCreateError(null);
      const replayError = resolveReplaySessionError(session, input.t);
      if (replayError) {
        input.setCreateError(replayError);
        return;
      }

      const success = await input.onPlayback(session);
      const replayFailure = resolveReplaySessionFailure(success, input.t);
      if (replayFailure) {
        input.setCreateError(replayFailure);
        return;
      }

      input.onSelectSession(session.id);
    },
    [input],
  );

  const handleReplayBookmark = useCallback(
    async (session: PersistedSession, replayWindowIndex: number) => {
      input.setCreateError(null);
      const success = await input.onReplayBookmark(session, replayWindowIndex);
      const replayError = resolveReplayBookmarkError(success, input.t);
      if (replayError) {
        input.setCreateError(replayError);
        return;
      }
      input.onSelectSession(session.id);
    },
    [input],
  );

  return {
    handleCreateSession,
    handleDirectLaunch,
    handleResumeSession,
    handlePlaybackSession,
    handleReplayBookmark,
  };
}
