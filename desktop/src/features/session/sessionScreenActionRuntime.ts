import type { PersistedSession } from "../../api/sessions";
import type { AppTranslations } from "../../i18n/en";
import {
  createDirectSessionStartPlan,
  createResumeSessionPlan,
  createSessionStartPlan,
  createSessionTimestampId,
  resolveReplayBookmarkError,
  resolveReplaySessionError,
  resolveReplaySessionFailure,
} from "./sessionScreenRuntime";
import type { UseSessionScreenActionsInput } from "./sessionScreenActionsTypes";

export function resolveSessionScreenActionError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function runSessionCreateAction(input: UseSessionScreenActionsInput): Promise<void> {
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
      resolveSessionScreenActionError(error, input.t.session.failedCreateSession),
    );
  } finally {
    input.setCreating(false);
  }
}

export async function runSessionDirectLaunchAction(
  input: UseSessionScreenActionsInput,
): Promise<void> {
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
      resolveSessionScreenActionError(error, input.t.session.failedCreateSession),
    );
  } finally {
    input.setIsDirectLoading(false);
  }
}

export async function runSessionResumeAction(
  input: UseSessionScreenActionsInput,
  sessionId: string,
): Promise<void> {
  try {
    input.setCreateError(null);
    const plan = createResumeSessionPlan(sessionId, input.sessions, input.repositories, input.t);
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
      resolveSessionScreenActionError(error, input.t.session.failedResumeSession),
    );
  }
}

export async function runSessionPlaybackAction(input: {
  session: PersistedSession;
  t: AppTranslations;
  onPlayback: (session: PersistedSession) => Promise<boolean>;
  onSelectSession: (sessionId: string) => void;
  setCreateError: (value: string | null) => void;
}): Promise<void> {
  input.setCreateError(null);
  const replayError = resolveReplaySessionError(input.session, input.t);
  if (replayError) {
    input.setCreateError(replayError);
    return;
  }

  const success = await input.onPlayback(input.session);
  const replayFailure = resolveReplaySessionFailure(success, input.t);
  if (replayFailure) {
    input.setCreateError(replayFailure);
    return;
  }

  input.onSelectSession(input.session.id);
}

export async function runSessionReplayBookmarkAction(input: {
  session: PersistedSession;
  replayWindowIndex: number;
  t: AppTranslations;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<boolean>;
  onSelectSession: (sessionId: string) => void;
  setCreateError: (value: string | null) => void;
}): Promise<void> {
  input.setCreateError(null);
  const success = await input.onReplayBookmark(input.session, input.replayWindowIndex);
  const replayError = resolveReplayBookmarkError(success, input.t);
  if (replayError) {
    input.setCreateError(replayError);
    return;
  }

  input.onSelectSession(input.session.id);
}
