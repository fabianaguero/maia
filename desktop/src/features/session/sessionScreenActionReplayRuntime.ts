import type { PersistedSession } from "../../api/sessions";
import type { AppTranslations } from "../../i18n/types";
import {
  resolveReplayBookmarkError,
  resolveReplaySessionError,
  resolveReplaySessionFailure,
} from "./sessionScreenRuntime";

interface RunSessionPlaybackActionInput {
  session: PersistedSession;
  t: AppTranslations;
  onPlayback: (session: PersistedSession) => Promise<boolean>;
  onSelectSession: (sessionId: string) => void;
  setCreateError: (value: string | null) => void;
}

interface RunSessionReplayBookmarkActionInput {
  session: PersistedSession;
  replayWindowIndex: number;
  t: AppTranslations;
  onReplayBookmark: (session: PersistedSession, replayWindowIndex: number) => Promise<boolean>;
  onSelectSession: (sessionId: string) => void;
  setCreateError: (value: string | null) => void;
}

export async function runSessionPlaybackAction(
  input: RunSessionPlaybackActionInput,
): Promise<void> {
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

export async function runSessionReplayBookmarkAction(
  input: RunSessionReplayBookmarkActionInput,
): Promise<void> {
  input.setCreateError(null);
  const success = await input.onReplayBookmark(input.session, input.replayWindowIndex);
  const replayError = resolveReplayBookmarkError(success, input.t);
  if (replayError) {
    input.setCreateError(replayError);
    return;
  }

  input.onSelectSession(input.session.id);
}
