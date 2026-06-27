import type { PersistedSession, SessionBookmark } from "../api/sessions";

export function toSessionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  return fallback;
}

export function sortSessionsByCreatedAt(sessions: PersistedSession[]): PersistedSession[] {
  return [...sessions].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function appendCreatedSession(
  sessions: PersistedSession[],
  nextSession: PersistedSession,
): PersistedSession[] {
  return sortSessionsByCreatedAt([
    nextSession,
    ...sessions.filter((session) => session.id !== nextSession.id),
  ]);
}

export function removeDeletedSession(
  sessions: PersistedSession[],
  sessionId: string,
): PersistedSession[] {
  return sessions.filter((session) => session.id !== sessionId);
}

export function removeDeletedSessionBookmarks(
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>,
  sessionId: string,
): Record<string, SessionBookmark[]> {
  const next = { ...sessionBookmarksBySessionId };
  delete next[sessionId];
  return next;
}

export function clearDeletedSelectedSessionId(
  selectedSessionId: string | null,
  sessionId: string,
): string | null {
  return selectedSessionId === sessionId ? null : selectedSessionId;
}

export function buildSessionBookmarksMap(
  entries: Array<readonly [string, SessionBookmark[]]>,
): Record<string, SessionBookmark[]> {
  return Object.fromEntries(entries);
}
