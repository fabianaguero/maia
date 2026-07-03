import { useState } from "react";
import { type PersistedSession, type SessionBookmark } from "../api/sessions";
import { useSessionBookmarksLoader } from "./useSessionBookmarksLoader";
import { useSessionsPersistence } from "./useSessionsPersistence";

export function useSessions() {
  const [sessions, setSessions] = useState<PersistedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionBookmarksBySessionId, setSessionBookmarksBySessionId] = useState<
    Record<string, SessionBookmark[]>
  >({});

  const { loadSessions, createSession, removeSession } = useSessionsPersistence({
    sessions,
    selectedSessionId,
    sessionBookmarksBySessionId,
    setSessions,
    setLoading,
    setMutating,
    setError,
    setSelectedSessionId,
    setSessionBookmarksBySessionId,
  });
  const refreshBookmarks = useSessionBookmarksLoader({
    sessions,
    setSessionBookmarksBySessionId,
    setError,
  });

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
