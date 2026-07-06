import { startTransition, useCallback, useEffect, useState } from "react";

import { deleteSessionBookmark, listSessionBookmarks, type SessionBookmark } from "../api/sessions";
import {
  buildReplayBookmarkPersistenceDeleteError,
  buildReplayBookmarkPersistenceLoadedState,
  buildReplayBookmarkPersistenceLoadError,
  buildReplayBookmarkPersistenceNativeRuntimeError,
  buildReplayBookmarkPersistenceResetState,
  buildReplayBookmarkPersistenceResult,
  buildReplayBookmarkDeleteSuccessState,
} from "./replayBookmarkPersistenceRuntime";

interface UseReplayBookmarkPersistenceOptions {
  replaySessionId: string | null;
}

export function useReplayBookmarkPersistence({
  replaySessionId,
}: UseReplayBookmarkPersistenceOptions) {
  const [sessionBookmarks, setSessionBookmarks] = useState<SessionBookmark[]>([]);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBookmarks() {
      if (!replaySessionId) {
        const resetState = buildReplayBookmarkPersistenceResetState();
        startTransition(() => {
          setSessionBookmarks(resetState.sessionBookmarks);
          setBookmarkBusy(resetState.bookmarkBusy);
          setBookmarkError(resetState.bookmarkError);
        });
        return;
      }

      setBookmarkBusy(true);
      setBookmarkError(null);

      try {
        const bookmarks = await listSessionBookmarks(replaySessionId);
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setSessionBookmarks(buildReplayBookmarkPersistenceLoadedState(bookmarks));
        });
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setBookmarkError(buildReplayBookmarkPersistenceLoadError(nextError));
        });
      } finally {
        if (!cancelled) {
          setBookmarkBusy(false);
        }
      }
    }

    void loadBookmarks();

    return () => {
      cancelled = true;
    };
  }, [replaySessionId]);

  const deleteReplayBookmark = useCallback(async (bookmark: SessionBookmark) => {
    setBookmarkBusy(true);
    setBookmarkError(null);

    try {
      const deleted = await deleteSessionBookmark(bookmark.id);
      if (!deleted) {
        setBookmarkError(buildReplayBookmarkPersistenceNativeRuntimeError());
        return false;
      }

      startTransition(() => {
        setSessionBookmarks((current) =>
          buildReplayBookmarkDeleteSuccessState(current, bookmark.id),
        );
      });
      return true;
    } catch (nextError) {
      setBookmarkError(buildReplayBookmarkPersistenceDeleteError(nextError));
      return false;
    } finally {
      setBookmarkBusy(false);
    }
  }, []);

  return buildReplayBookmarkPersistenceResult({
    sessionBookmarks,
    setSessionBookmarks,
    bookmarkBusy,
    setBookmarkBusy,
    bookmarkError,
    setBookmarkError,
    deleteReplayBookmark,
  });
}
