import type { PersistedSession, SessionBookmark } from "../api/sessions";
import {
  appendCreatedSession,
  buildSessionBookmarksMap,
  clearDeletedSelectedSessionId,
  removeDeletedSession,
  removeDeletedSessionBookmarks,
  sortSessionsByCreatedAt,
} from "./sessionsRuntime";

export function buildLoadedSessionsState(sessions: PersistedSession[]) {
  return {
    sessions: sortSessionsByCreatedAt(sessions),
    error: null as string | null,
  };
}

export function buildLoadedSessionBookmarksState(
  entries: Array<readonly [string, SessionBookmark[]]>,
) {
  return {
    sessionBookmarksBySessionId: buildSessionBookmarksMap(entries),
    error: null as string | null,
  };
}

export function buildCreatedSessionState(sessions: PersistedSession[], session: PersistedSession) {
  return {
    sessions: appendCreatedSession(sessions, session),
    selectedSessionId: session.id,
    error: null as string | null,
  };
}

export function buildRemovedSessionState(input: {
  sessions: PersistedSession[];
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  selectedSessionId: string | null;
  sessionId: string;
}) {
  return {
    sessions: removeDeletedSession(input.sessions, input.sessionId),
    sessionBookmarksBySessionId: removeDeletedSessionBookmarks(
      input.sessionBookmarksBySessionId,
      input.sessionId,
    ),
    selectedSessionId: clearDeletedSelectedSessionId(input.selectedSessionId, input.sessionId),
    error: null as string | null,
  };
}
