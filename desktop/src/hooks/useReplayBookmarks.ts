import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteSessionBookmark,
  listSessionBookmarks,
  upsertSessionBookmark,
  type SessionBookmark,
} from "../api/sessions";

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected replay bookmark failure.";
}

interface ReplayExplanationSnapshot {
  eventIndex: number | null;
  trackId: string | null;
  trackTitle: string | null;
  trackSecond: number | null;
}

interface UseReplayBookmarksOptions {
  replaySessionId: string | null;
  replayActive: boolean;
  replayWindowIndex: number | null;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  currentReplayExplanation: ReplayExplanationSnapshot | null;
  fallbackTrackId: string | null;
  fallbackTrackTitle: string | null;
  fallbackTrackSecond: number | null;
}

export function useReplayBookmarks({
  replaySessionId,
  replayActive,
  replayWindowIndex,
  selectedStyleProfileId,
  selectedMutationProfileId,
  currentReplayExplanation,
  fallbackTrackId,
  fallbackTrackTitle,
  fallbackTrackSecond,
}: UseReplayBookmarksOptions) {
  const [sessionBookmarks, setSessionBookmarks] = useState<SessionBookmark[]>([]);
  const [bookmarkLabelDraft, setBookmarkLabelDraft] = useState("");
  const [bookmarkNoteDraft, setBookmarkNoteDraft] = useState("");
  const [bookmarkTagDraft, setBookmarkTagDraft] = useState<string | null>(null);
  const [bookmarkStyleProfileIdDraft, setBookmarkStyleProfileIdDraft] = useState<string | null>(
    null,
  );
  const [bookmarkMutationProfileIdDraft, setBookmarkMutationProfileIdDraft] = useState<
    string | null
  >(null);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);

  const sortedSessionBookmarks = useMemo(
    () =>
      sessionBookmarks
        .slice()
        .sort((left, right) => left.replayWindowIndex - right.replayWindowIndex),
    [sessionBookmarks],
  );

  const activeReplayBookmark = useMemo(
    () =>
      replayActive && replayWindowIndex !== null
        ? sortedSessionBookmarks.find(
            (bookmark) => bookmark.replayWindowIndex === replayWindowIndex,
          ) ?? null
        : null,
    [replayActive, replayWindowIndex, sortedSessionBookmarks],
  );

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
          setSessionBookmarks(
            bookmarks
              .slice()
              .sort((left, right) => left.replayWindowIndex - right.replayWindowIndex),
          );
        });
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setBookmarkError(`Failed to load replay bookmarks: ${toMessage(nextError)}`);
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

  useEffect(() => {
    if (!replayActive || replayWindowIndex === null) {
      setBookmarkLabelDraft("");
      setBookmarkNoteDraft("");
      setBookmarkTagDraft(null);
      setBookmarkStyleProfileIdDraft(null);
      setBookmarkMutationProfileIdDraft(null);
      return;
    }

    if (activeReplayBookmark) {
      setBookmarkLabelDraft(activeReplayBookmark.label);
      setBookmarkNoteDraft(activeReplayBookmark.note);
      setBookmarkTagDraft(activeReplayBookmark.bookmarkTag);
      setBookmarkStyleProfileIdDraft(activeReplayBookmark.suggestedStyleProfileId);
      setBookmarkMutationProfileIdDraft(activeReplayBookmark.suggestedMutationProfileId);
      return;
    }

    setBookmarkLabelDraft(`Window ${replayWindowIndex}`);
    setBookmarkNoteDraft("");
    setBookmarkTagDraft(null);
    setBookmarkStyleProfileIdDraft(selectedStyleProfileId);
    setBookmarkMutationProfileIdDraft(selectedMutationProfileId);
  }, [
    activeReplayBookmark,
    replayActive,
    replayWindowIndex,
    selectedStyleProfileId,
    selectedMutationProfileId,
  ]);

  const captureCurrentScene = useCallback(() => {
    setBookmarkStyleProfileIdDraft(selectedStyleProfileId);
    setBookmarkMutationProfileIdDraft(selectedMutationProfileId);
  }, [selectedStyleProfileId, selectedMutationProfileId]);

  const saveReplayBookmark = useCallback(async () => {
    if (!replaySessionId || replayWindowIndex === null) {
      return null;
    }

    setBookmarkBusy(true);
    setBookmarkError(null);

    try {
      const label = bookmarkLabelDraft.trim() || `Window ${replayWindowIndex}`;
      const note = bookmarkNoteDraft.trim();
      const savedBookmark = await upsertSessionBookmark({
        sessionId: replaySessionId,
        replayWindowIndex,
        eventIndex: currentReplayExplanation?.eventIndex ?? null,
        label,
        note,
        bookmarkTag: bookmarkTagDraft,
        suggestedStyleProfileId: bookmarkStyleProfileIdDraft,
        suggestedMutationProfileId: bookmarkMutationProfileIdDraft,
        trackId: currentReplayExplanation?.trackId ?? fallbackTrackId,
        trackTitle: currentReplayExplanation?.trackTitle ?? fallbackTrackTitle,
        trackSecond: currentReplayExplanation?.trackSecond ?? fallbackTrackSecond,
      });

      if (!savedBookmark) {
        setBookmarkError("Replay bookmarks require the native desktop runtime.");
        return null;
      }

      startTransition(() => {
        setSessionBookmarks((current) =>
          [
            ...current.filter(
              (bookmark) =>
                bookmark.id !== savedBookmark.id &&
                bookmark.replayWindowIndex !== savedBookmark.replayWindowIndex,
            ),
            savedBookmark,
          ].sort((left, right) => left.replayWindowIndex - right.replayWindowIndex),
        );
      });

      return savedBookmark;
    } catch (nextError) {
      setBookmarkError(`Failed to save replay bookmark: ${toMessage(nextError)}`);
      return null;
    } finally {
      setBookmarkBusy(false);
    }
  }, [
    bookmarkLabelDraft,
    bookmarkMutationProfileIdDraft,
    bookmarkNoteDraft,
    bookmarkStyleProfileIdDraft,
    bookmarkTagDraft,
    currentReplayExplanation,
    fallbackTrackId,
    fallbackTrackSecond,
    fallbackTrackTitle,
    replaySessionId,
    replayWindowIndex,
  ]);

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
        setSessionBookmarks((current) => current.filter((entry) => entry.id !== bookmark.id));
      });
      return true;
    } catch (nextError) {
      setBookmarkError(`Failed to delete replay bookmark: ${toMessage(nextError)}`);
      return false;
    } finally {
      setBookmarkBusy(false);
    }
  }, []);

  return {
    sessionBookmarks,
    sortedSessionBookmarks,
    activeReplayBookmark,
    bookmarkLabelDraft,
    setBookmarkLabelDraft,
    bookmarkNoteDraft,
    setBookmarkNoteDraft,
    bookmarkTagDraft,
    setBookmarkTagDraft,
    bookmarkStyleProfileIdDraft,
    setBookmarkStyleProfileIdDraft,
    bookmarkMutationProfileIdDraft,
    setBookmarkMutationProfileIdDraft,
    bookmarkBusy,
    bookmarkError,
    captureCurrentScene,
    saveReplayBookmark,
    deleteReplayBookmark,
  };
}
