import type { SessionBookmark, UpsertSessionBookmarkInput } from "../api/sessions";

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

export function canSaveReplayBookmark(
  replaySessionId: string | null,
  replayWindowIndex: number | null,
): replayWindowIndex is number {
  return Boolean(replaySessionId) && replayWindowIndex !== null;
}

export function resolveReplayBookmarkSaveContext(
  replaySessionId: string | null,
  replayWindowIndex: number | null,
): { replaySessionId: string; replayWindowIndex: number } | null {
  if (!canSaveReplayBookmark(replaySessionId, replayWindowIndex) || !replaySessionId) {
    return null;
  }

  return {
    replaySessionId,
    replayWindowIndex,
  };
}

export function buildReplayBookmarkNativeRuntimeError(): string {
  return "Replay bookmarks require the native desktop runtime.";
}

export function buildReplayBookmarkLoadErrorMessage(error: unknown): string {
  return `Failed to load replay bookmarks: ${toReplayBookmarkErrorMessage(error)}`;
}

export function buildReplayBookmarkSaveErrorMessage(error: unknown): string {
  return `Failed to save replay bookmark: ${toReplayBookmarkErrorMessage(error)}`;
}

export function buildReplayBookmarkDeleteErrorMessage(error: unknown): string {
  return `Failed to delete replay bookmark: ${toReplayBookmarkErrorMessage(error)}`;
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

export function buildReplayBookmarkUpsertInput(input: {
  replaySessionId: string;
  replayWindowIndex: number;
  bookmarkLabelDraft: string;
  bookmarkNoteDraft: string;
  bookmarkTagDraft: string | null;
  bookmarkStyleProfileIdDraft: string | null;
  bookmarkMutationProfileIdDraft: string | null;
  currentReplayExplanation: ReplayExplanationSnapshot | null;
  fallbackTrackId: string | null;
  fallbackTrackTitle: string | null;
  fallbackTrackSecond: number | null;
}): UpsertSessionBookmarkInput {
  return {
    sessionId: input.replaySessionId,
    replayWindowIndex: input.replayWindowIndex,
    eventIndex: input.currentReplayExplanation?.eventIndex ?? null,
    label: input.bookmarkLabelDraft.trim() || `Window ${input.replayWindowIndex}`,
    note: input.bookmarkNoteDraft.trim(),
    bookmarkTag: input.bookmarkTagDraft,
    suggestedStyleProfileId: input.bookmarkStyleProfileIdDraft,
    suggestedMutationProfileId: input.bookmarkMutationProfileIdDraft,
    trackId: input.currentReplayExplanation?.trackId ?? input.fallbackTrackId,
    trackTitle: input.currentReplayExplanation?.trackTitle ?? input.fallbackTrackTitle,
    trackSecond: input.currentReplayExplanation?.trackSecond ?? input.fallbackTrackSecond,
  };
}
