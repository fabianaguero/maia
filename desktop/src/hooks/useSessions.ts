import { useEffect, useState } from "react";
import {
  createPersistedSession,
  deletePersistedSession,
  listPersistedSessions,
  listSessionBookmarks,
  type CreateSessionInput,
  type PersistedSession,
  type SessionBookmark,
} from "../api/sessions";
import {
  appendCreatedSession,
  buildSessionBookmarksMap,
  clearDeletedSelectedSessionId,
  removeDeletedSession,
  removeDeletedSessionBookmarks,
  sortSessionsByCreatedAt,
  toSessionErrorMessage,
} from "./sessionsRuntime";

export function useSessions() {
  const [sessions, setSessions] = useState<PersistedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionBookmarksBySessionId, setSessionBookmarksBySessionId] = useState<
    Record<string, SessionBookmark[]>
  >({});

  async function loadSessions() {
    setLoading(true);
    try {
      const data = await listPersistedSessions();
      setSessions(sortSessionsByCreatedAt(data));
      setError(null);
    } catch (err) {
      setError(toSessionErrorMessage(err, "Failed to load sessions"));
    } finally {
      setLoading(false);
    }
  }

  async function refreshBookmarks() {
    try {
      const entries = await Promise.all(
        sessions.map(async (session) => {
          const bookmarks = await listSessionBookmarks(session.id);
          return [session.id, bookmarks] as const;
        }),
      );
      setSessionBookmarksBySessionId(buildSessionBookmarksMap(entries));
      setError(null);
    } catch (err) {
      setError(toSessionErrorMessage(err, "Failed to load session bookmarks"));
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  async function createSession(input: CreateSessionInput) {
    setMutating(true);
    try {
      const session = await createPersistedSession(input);
      if (session) {
        setSessions((prev) => appendCreatedSession(prev, session));
        setSelectedSessionId(session.id);
      }
      setError(null);
      return session;
    } catch (err) {
      setError(toSessionErrorMessage(err, "Failed to create session"));
      return null;
    } finally {
      setMutating(false);
    }
  }

  async function removeSession(id: string): Promise<void> {
    setMutating(true);
    try {
      const success = await deletePersistedSession(id);
      if (success) {
        setSessions((prev) => removeDeletedSession(prev, id));
        setSessionBookmarksBySessionId((prev) => removeDeletedSessionBookmarks(prev, id));
        setSelectedSessionId((prev) => clearDeletedSelectedSessionId(prev, id));
      }
      setError(null);
    } catch (err) {
      setError(toSessionErrorMessage(err, "Failed to delete session"));
    } finally {
      setMutating(false);
    }
  }

  return {
    sessions,
    sessionBookmarksBySessionId,
    selectedSessionId,
    loading,
    mutating,
    error,
    clearError: () => setError(null),
    refresh: loadSessions,
    refreshBookmarks,
    createSession,
    removeSession,
    setSelectedSessionId,
  };
}
