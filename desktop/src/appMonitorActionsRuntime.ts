import type { PersistedSession } from "./api/sessions";
import type { RepositoryAnalysis } from "./types/library";

export interface SessionMonitorDraft {
  trackId?: string;
  playlistId?: string;
}

export type SessionPersistenceAction = "create" | "select";

export function resolveReplayMonitorDraft(
  session: PersistedSession,
): SessionMonitorDraft {
  return {
    trackId: session.trackId ?? undefined,
    playlistId: session.playlistId ?? undefined,
  };
}

export function resolveSessionPersistenceAction(input: {
  sessions: readonly PersistedSession[];
  persistedSessionId: string;
}): SessionPersistenceAction {
  return input.sessions.some((entry) => entry.id === input.persistedSessionId)
    ? "select"
    : "create";
}

export function resolveMonitoredRepository(
  monitorSession: {
    repoId: string;
  } | null,
  repositories: readonly RepositoryAnalysis[],
): RepositoryAnalysis | null {
  if (!monitorSession) {
    return null;
  }

  return repositories.find((entry) => entry.id === monitorSession.repoId) ?? null;
}
