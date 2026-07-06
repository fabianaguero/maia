import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect } from "react";

import {
  createPersistedSession,
  deletePersistedSession,
  listPersistedSessions,
  type CreateSessionInput,
  type PersistedSession,
  type SessionBookmark,
} from "../api/sessions";
import { toSessionErrorMessage } from "./sessionsRuntime";
import {
  buildCreatedSessionState,
  buildLoadedSessionsState,
  buildRemovedSessionState,
} from "./sessionsStateRuntime";

interface UseSessionsPersistenceInput {
  sessions: PersistedSession[];
  selectedSessionId: string | null;
  sessionBookmarksBySessionId: Record<string, SessionBookmark[]>;
  setSessions: Dispatch<SetStateAction<PersistedSession[]>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setMutating: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSelectedSessionId: Dispatch<SetStateAction<string | null>>;
  setSessionBookmarksBySessionId: Dispatch<SetStateAction<Record<string, SessionBookmark[]>>>;
}

export function useSessionsPersistence(input: UseSessionsPersistenceInput) {
  const {
    sessions,
    selectedSessionId,
    sessionBookmarksBySessionId,
    setSessions,
    setLoading,
    setMutating,
    setError,
    setSelectedSessionId,
    setSessionBookmarksBySessionId,
  } = input;

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPersistedSessions();
      const nextState = buildLoadedSessionsState(data);
      setSessions(nextState.sessions);
      setError(nextState.error);
    } catch (err) {
      setError(toSessionErrorMessage(err, "Failed to load sessions"));
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setSessions]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const createSession = useCallback(
    async (createInput: CreateSessionInput) => {
      setMutating(true);
      try {
        const session = await createPersistedSession(createInput);
        if (session) {
          const nextState = buildCreatedSessionState(sessions, session);
          setSessions(nextState.sessions);
          setSelectedSessionId(nextState.selectedSessionId);
        }
        setError(null);
        return session;
      } catch (err) {
        setError(toSessionErrorMessage(err, "Failed to create session"));
        return null;
      } finally {
        setMutating(false);
      }
    },
    [sessions, setError, setMutating, setSelectedSessionId, setSessions],
  );

  const removeSession = useCallback(
    async (sessionId: string): Promise<void> => {
      setMutating(true);
      try {
        const success = await deletePersistedSession(sessionId);
        if (success) {
          const nextState = buildRemovedSessionState({
            sessions,
            sessionBookmarksBySessionId,
            selectedSessionId,
            sessionId,
          });
          setSessions(nextState.sessions);
          setSessionBookmarksBySessionId(nextState.sessionBookmarksBySessionId);
          setSelectedSessionId(nextState.selectedSessionId);
        }
        setError(null);
      } catch (err) {
        setError(toSessionErrorMessage(err, "Failed to delete session"));
      } finally {
        setMutating(false);
      }
    },
    [
      selectedSessionId,
      sessionBookmarksBySessionId,
      sessions,
      setError,
      setMutating,
      setSelectedSessionId,
      setSessionBookmarksBySessionId,
      setSessions,
    ],
  );

  return {
    loadSessions,
    createSession,
    removeSession,
  };
}
