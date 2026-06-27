import type { SessionBookmark } from "../api/sessions";

export interface ReplayExplanationSnapshot {
  eventIndex: number | null;
  trackId: string | null;
  trackTitle: string | null;
  trackSecond: number | null;
}

export interface ReplayBookmarkDraftState {
  label: string;
  note: string;
  tag: string | null;
  styleProfileId: string | null;
  mutationProfileId: string | null;
}

export function toReplayBookmarkErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Unexpected replay bookmark failure.";
}

export function sortReplayBookmarks(
  sessionBookmarks: readonly SessionBookmark[],
): SessionBookmark[] {
  return [...sessionBookmarks].sort(
    (left, right) => left.replayWindowIndex - right.replayWindowIndex,
  );
}

export function resolveActiveReplayBookmark(
  sessionBookmarks: readonly SessionBookmark[],
  replayActive: boolean,
  replayWindowIndex: number | null,
): SessionBookmark | null {
  if (!replayActive || replayWindowIndex === null) {
    return null;
  }

  return (
    sortReplayBookmarks(sessionBookmarks).find(
      (bookmark) => bookmark.replayWindowIndex === replayWindowIndex,
    ) ?? null
  );
}

export function buildReplayBookmarkDraftState(options: {
  activeReplayBookmark: SessionBookmark | null;
  replayActive: boolean;
  replayWindowIndex: number | null;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
}): ReplayBookmarkDraftState {
  const {
    activeReplayBookmark,
    replayActive,
    replayWindowIndex,
    selectedStyleProfileId,
    selectedMutationProfileId,
  } = options;

  if (!replayActive || replayWindowIndex === null) {
    return {
      label: "",
      note: "",
      tag: null,
      styleProfileId: null,
      mutationProfileId: null,
    };
  }

  if (activeReplayBookmark) {
    return {
      label: activeReplayBookmark.label,
      note: activeReplayBookmark.note,
      tag: activeReplayBookmark.bookmarkTag,
      styleProfileId: activeReplayBookmark.suggestedStyleProfileId,
      mutationProfileId: activeReplayBookmark.suggestedMutationProfileId,
    };
  }

  return {
    label: `Window ${replayWindowIndex}`,
    note: "",
    tag: null,
    styleProfileId: selectedStyleProfileId,
    mutationProfileId: selectedMutationProfileId,
  };
}

export function upsertSortedReplayBookmark(
  sessionBookmarks: readonly SessionBookmark[],
  savedBookmark: SessionBookmark,
): SessionBookmark[] {
  return sortReplayBookmarks([
    ...sessionBookmarks.filter(
      (bookmark) =>
        bookmark.id !== savedBookmark.id &&
        bookmark.replayWindowIndex !== savedBookmark.replayWindowIndex,
    ),
    savedBookmark,
  ]);
}

export function removeReplayBookmark(
  sessionBookmarks: readonly SessionBookmark[],
  bookmarkId: number,
): SessionBookmark[] {
  return sessionBookmarks.filter((bookmark) => bookmark.id !== bookmarkId);
}
