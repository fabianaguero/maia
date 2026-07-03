import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";

import { listSessionBookmarks, type PersistedSession, type SessionBookmark } from "../api/sessions";
import { toSessionErrorMessage } from "./sessionsRuntime";
import { buildLoadedSessionBookmarksState } from "./sessionsStateRuntime";

interface UseSessionBookmarksLoaderInput {
  sessions: PersistedSession[];
  setSessionBookmarksBySessionId: Dispatch<SetStateAction<Record<string, SessionBookmark[]>>>;
  setError: Dispatch<SetStateAction<string | null>>;
}

export function useSessionBookmarksLoader({
  sessions,
  setSessionBookmarksBySessionId,
  setError,
}: UseSessionBookmarksLoaderInput) {
  return useCallback(async () => {
    try {
      const entries = await Promise.all(
        sessions.map(async (session) => {
          const bookmarks = await listSessionBookmarks(session.id);
          return [session.id, bookmarks] as const;
        }),
      );
      const nextState = buildLoadedSessionBookmarksState(entries);
      setSessionBookmarksBySessionId(nextState.sessionBookmarksBySessionId);
      setError(nextState.error);
    } catch (err) {
      setError(toSessionErrorMessage(err, "Failed to load session bookmarks"));
    }
  }, [sessions, setError, setSessionBookmarksBySessionId]);
}
