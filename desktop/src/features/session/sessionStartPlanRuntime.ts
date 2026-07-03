import type { PersistedSession } from "../../api/sessions";
import type { RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";
import {
  buildDirectSessionStartInput,
  buildLiveSessionStartInput,
  buildResumeSessionStartInput,
  buildSessionStartDraft,
} from "./sessionStartPlanInputRuntime";
import {
  resolveRepositorySourcePathError,
  resolveResumeSessionError,
  resolveResumeSessionSource,
  resolveSelectedSessionRepository,
  resolveSessionStartSourceError,
} from "./sessionStartPlanSourceRuntime";
import type { SessionScreenCopy, SessionStartDraft } from "./sessionStartPlanTypes";

interface SessionStartPlanResult {
  error: string | null;
  draft?: SessionStartDraft;
  input?: StartSessionInput;
  sessionId?: string;
}

export function createSessionStartPlan(
  input: {
    baseMode: SessionBaseMode;
    mode: QuickSessionMode;
    repositories: RepositoryAnalysis[];
    selectedPlaylistId: string | null;
    selectedSourceId: string | null;
    selectedTrackId: string | null;
    sessionLabel: string;
  },
  copy: SessionScreenCopy,
  createSessionId: () => string,
): SessionStartPlanResult {
  const sourceError = resolveSessionStartSourceError({
    baseMode: input.baseMode,
    mode: input.mode,
    selectedPlaylistId: input.selectedPlaylistId,
    selectedSourceId: input.selectedSourceId,
    selectedTrackId: input.selectedTrackId,
    copy,
  });
  if (sourceError) {
    return { error: sourceError };
  }

  const source = resolveSelectedSessionRepository(input.repositories, input.selectedSourceId);
  const repositoryError = resolveRepositorySourcePathError(source, copy);
  if (repositoryError || !source) {
    return { error: repositoryError };
  }

  const sessionId = createSessionId();
  return {
    error: null,
    sessionId,
    input: buildLiveSessionStartInput({
      sessionId,
      source,
      sessionLabel: input.sessionLabel,
    }),
    draft: buildSessionStartDraft({
      baseMode: input.baseMode,
      sourceId: source.id,
      selectedTrackId: input.selectedTrackId,
      selectedPlaylistId: input.selectedPlaylistId,
    }),
  };
}

export function createDirectSessionStartPlan(
  input: {
    directPath: string;
    selectedPlaylistId: string | null;
    selectedTrackId: string | null;
  },
  copy: SessionScreenCopy,
  createSessionId: () => string,
): SessionStartPlanResult {
  const source = input.directPath.trim();
  if (!source) {
    return { error: null };
  }

  const sessionId = createSessionId();
  return {
    error: null,
    sessionId,
    input: buildDirectSessionStartInput({ sessionId, source, copy }),
    draft: {
      trackId: input.selectedTrackId ?? undefined,
      playlistId: input.selectedPlaylistId ?? undefined,
    },
  };
}

export function createResumeSessionPlan(
  sessionId: string,
  sessions: PersistedSession[],
  repositories: RepositoryAnalysis[],
  copy: SessionScreenCopy,
): SessionStartPlanResult {
  const { session, source, sourcePath } = resolveResumeSessionSource({
    sessionId,
    sessions,
    repositories,
  });
  if (!session) {
    return { error: null };
  }

  const resumeError = resolveResumeSessionError({
    session,
    sourcePath,
    copy,
  });
  if (resumeError || !sourcePath) {
    return { error: resumeError };
  }

  return {
    error: null,
    sessionId: session.id,
    input: buildResumeSessionStartInput({ session, source, sourcePath, copy }),
    draft: {
      sourceId: session.sourceId ?? undefined,
      trackId: session.trackId ?? undefined,
      playlistId: session.playlistId ?? undefined,
    },
  };
}

export {
  buildSessionLabelPlaceholder,
  createSessionTimestampId,
  resolvePlaybackPercent,
  resolveReadyToRun,
} from "./sessionStartPlanDisplayRuntime";
export {
  resolveReplayBookmarkError,
  resolveReplaySessionError,
  resolveReplaySessionFailure,
} from "./sessionReplayRuntime";
export type { SessionScreenCopy, SessionStartDraft } from "./sessionStartPlanTypes";
