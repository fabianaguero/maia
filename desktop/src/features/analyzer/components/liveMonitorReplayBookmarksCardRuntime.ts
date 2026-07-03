import type { SessionBookmark } from "../../../api/sessions";

export function resolveReplayBookmarkCardTitle(input: {
  activeReplayBookmark: SessionBookmark | null;
  replayWindowIndex: number;
  savedLabel: string;
  unsavedLabel: string;
}): string {
  const { activeReplayBookmark, replayWindowIndex, savedLabel, unsavedLabel } = input;

  return activeReplayBookmark
    ? savedLabel.replace("{window}", String(replayWindowIndex))
    : unsavedLabel.replace("{window}", String(replayWindowIndex));
}

export function resolveReplayBookmarkSaveLabel(input: {
  bookmarkBusy: boolean;
  activeReplayBookmark: SessionBookmark | null;
  savingLabel: string;
  updateLabel: string;
  createLabel: string;
}): string {
  const { bookmarkBusy, activeReplayBookmark, savingLabel, updateLabel, createLabel } = input;
  if (bookmarkBusy) {
    return savingLabel;
  }

  return activeReplayBookmark ? updateLabel : createLabel;
}

export function canApplyReplayBookmarkSuggestion(bookmark: SessionBookmark): boolean {
  return Boolean(bookmark.suggestedStyleProfileId || bookmark.suggestedMutationProfileId);
}
