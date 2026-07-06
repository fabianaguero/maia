import type { SessionBookmark } from "../api/sessions";
import type { Dispatch, SetStateAction } from "react";
import {
  buildReplayBookmarkDeleteErrorMessage,
  buildReplayBookmarkLoadErrorMessage,
  buildReplayBookmarkNativeRuntimeError,
  removeReplayBookmark,
  sortReplayBookmarks,
} from "./replayBookmarksRuntime";

export function buildReplayBookmarkPersistenceResetState() {
  return {
    sessionBookmarks: [] as SessionBookmark[],
    bookmarkBusy: false,
    bookmarkError: null as string | null,
  };
}

export function buildReplayBookmarkPersistenceLoadedState(
  sessionBookmarks: readonly SessionBookmark[],
) {
  return sortReplayBookmarks(sessionBookmarks);
}

export function buildReplayBookmarkDeleteSuccessState(
  sessionBookmarks: readonly SessionBookmark[],
  bookmarkId: number,
) {
  return removeReplayBookmark(sessionBookmarks, bookmarkId);
}

export function buildReplayBookmarkPersistenceLoadError(error: unknown): string {
  return buildReplayBookmarkLoadErrorMessage(error);
}

export function buildReplayBookmarkPersistenceDeleteError(error: unknown): string {
  return buildReplayBookmarkDeleteErrorMessage(error);
}

export function buildReplayBookmarkPersistenceNativeRuntimeError(): string {
  return buildReplayBookmarkNativeRuntimeError();
}

export function buildReplayBookmarkPersistenceResult(input: {
  sessionBookmarks: SessionBookmark[];
  setSessionBookmarks: Dispatch<SetStateAction<SessionBookmark[]>>;
  bookmarkBusy: boolean;
  setBookmarkBusy: Dispatch<SetStateAction<boolean>>;
  bookmarkError: string | null;
  setBookmarkError: Dispatch<SetStateAction<string | null>>;
  deleteReplayBookmark: (bookmark: SessionBookmark) => Promise<boolean>;
}) {
  return input;
}
