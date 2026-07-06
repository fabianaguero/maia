import { startTransition, useCallback, useMemo } from "react";
import { upsertSessionBookmark } from "../api/sessions";
import {
  buildReplayBookmarkUpsertInput,
  buildReplayBookmarkNativeRuntimeError,
  buildReplayBookmarkSaveErrorMessage,
  resolveReplayBookmarkSaveContext,
  resolveActiveReplayBookmark,
  sortReplayBookmarks,
  type ReplayExplanationSnapshot,
  upsertSortedReplayBookmark,
} from "./replayBookmarksRuntime";
import { useReplayBookmarkDraftState } from "./useReplayBookmarkDraftState";
import { useReplayBookmarkPersistence } from "./useReplayBookmarkPersistence";

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
  const persistence = useReplayBookmarkPersistence({ replaySessionId });

  const sortedSessionBookmarks = useMemo(
    () => sortReplayBookmarks(persistence.sessionBookmarks),
    [persistence.sessionBookmarks],
  );

  const activeReplayBookmark = useMemo(
    () => resolveActiveReplayBookmark(sortedSessionBookmarks, replayActive, replayWindowIndex),
    [replayActive, replayWindowIndex, sortedSessionBookmarks],
  );

  const syncedDraftState = useReplayBookmarkDraftState({
    activeReplayBookmark,
    replayActive,
    replayWindowIndex,
    selectedStyleProfileId,
    selectedMutationProfileId,
  });

  const saveReplayBookmark = useCallback(async () => {
    const saveContext = resolveReplayBookmarkSaveContext(replaySessionId, replayWindowIndex);
    if (!saveContext) {
      return null;
    }

    persistence.setBookmarkBusy(true);
    persistence.setBookmarkError(null);

    try {
      const savedBookmark = await upsertSessionBookmark(
        buildReplayBookmarkUpsertInput({
          replaySessionId: saveContext.replaySessionId,
          replayWindowIndex: saveContext.replayWindowIndex,
          bookmarkLabelDraft: syncedDraftState.bookmarkLabelDraft,
          bookmarkNoteDraft: syncedDraftState.bookmarkNoteDraft,
          bookmarkTagDraft: syncedDraftState.bookmarkTagDraft,
          bookmarkStyleProfileIdDraft: syncedDraftState.bookmarkStyleProfileIdDraft,
          bookmarkMutationProfileIdDraft: syncedDraftState.bookmarkMutationProfileIdDraft,
          currentReplayExplanation,
          fallbackTrackId,
          fallbackTrackTitle,
          fallbackTrackSecond,
        }),
      );

      if (!savedBookmark) {
        persistence.setBookmarkError(buildReplayBookmarkNativeRuntimeError());
        return null;
      }

      startTransition(() => {
        persistence.setSessionBookmarks((current) =>
          upsertSortedReplayBookmark(current, savedBookmark),
        );
      });

      return savedBookmark;
    } catch (nextError) {
      persistence.setBookmarkError(buildReplayBookmarkSaveErrorMessage(nextError));
      return null;
    } finally {
      persistence.setBookmarkBusy(false);
    }
  }, [
    replaySessionId,
    replayWindowIndex,
    syncedDraftState.bookmarkLabelDraft,
    syncedDraftState.bookmarkNoteDraft,
    syncedDraftState.bookmarkTagDraft,
    syncedDraftState.bookmarkStyleProfileIdDraft,
    syncedDraftState.bookmarkMutationProfileIdDraft,
    currentReplayExplanation,
    fallbackTrackId,
    fallbackTrackTitle,
    fallbackTrackSecond,
    persistence,
  ]);

  return {
    sessionBookmarks: persistence.sessionBookmarks,
    sortedSessionBookmarks,
    activeReplayBookmark,
    bookmarkLabelDraft: syncedDraftState.bookmarkLabelDraft,
    setBookmarkLabelDraft: syncedDraftState.setBookmarkLabelDraft,
    bookmarkNoteDraft: syncedDraftState.bookmarkNoteDraft,
    setBookmarkNoteDraft: syncedDraftState.setBookmarkNoteDraft,
    bookmarkTagDraft: syncedDraftState.bookmarkTagDraft,
    setBookmarkTagDraft: syncedDraftState.setBookmarkTagDraft,
    bookmarkStyleProfileIdDraft: syncedDraftState.bookmarkStyleProfileIdDraft,
    setBookmarkStyleProfileIdDraft: syncedDraftState.setBookmarkStyleProfileIdDraft,
    bookmarkMutationProfileIdDraft: syncedDraftState.bookmarkMutationProfileIdDraft,
    setBookmarkMutationProfileIdDraft: syncedDraftState.setBookmarkMutationProfileIdDraft,
    bookmarkBusy: persistence.bookmarkBusy,
    bookmarkError: persistence.bookmarkError,
    captureCurrentScene: syncedDraftState.captureCurrentScene,
    saveReplayBookmark,
    deleteReplayBookmark: persistence.deleteReplayBookmark,
  };
}
