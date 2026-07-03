import { startTransition, useCallback, useEffect, useState } from "react";

import { deleteSessionBookmark, listSessionBookmarks, type SessionBookmark } from "../api/sessions";
import {
  removeReplayBookmark,
  sortReplayBookmarks,
  toReplayBookmarkErrorMessage,
} from "./replayBookmarksRuntime";

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
        startTransition(() => {
          setSessionBookmarks([]);
          setBookmarkBusy(false);
          setBookmarkError(null);
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
          setSessionBookmarks(sortReplayBookmarks(bookmarks));
        });
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setBookmarkError(
            `Failed to load replay bookmarks: ${toReplayBookmarkErrorMessage(nextError)}`,
          );
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
        setBookmarkError("Replay bookmarks require the native desktop runtime.");
        return false;
      }

      startTransition(() => {
        setSessionBookmarks((current) => removeReplayBookmark(current, bookmark.id));
      });
      return true;
    } catch (nextError) {
      setBookmarkError(
        `Failed to delete replay bookmark: ${toReplayBookmarkErrorMessage(nextError)}`,
      );
      return false;
    } finally {
      setBookmarkBusy(false);
    }
  }, []);

  return {
    sessionBookmarks,
    setSessionBookmarks,
    bookmarkBusy,
    setBookmarkBusy,
    bookmarkError,
    setBookmarkError,
    deleteReplayBookmark,
  };
}
