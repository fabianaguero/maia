import { useCallback, useEffect, useState } from "react";

import { buildReplayBookmarkDraftState } from "./replayBookmarksRuntime";
import type { SessionBookmark } from "../api/sessions";

interface UseReplayBookmarkDraftStateOptions {
  activeReplayBookmark: SessionBookmark | null;
  replayActive: boolean;
  replayWindowIndex: number | null;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
}

export function useReplayBookmarkDraftState({
  activeReplayBookmark,
  replayActive,
  replayWindowIndex,
  selectedStyleProfileId,
  selectedMutationProfileId,
}: UseReplayBookmarkDraftStateOptions) {
  const [bookmarkLabelDraft, setBookmarkLabelDraft] = useState("");
  const [bookmarkNoteDraft, setBookmarkNoteDraft] = useState("");
  const [bookmarkTagDraft, setBookmarkTagDraft] = useState<string | null>(null);
  const [bookmarkStyleProfileIdDraft, setBookmarkStyleProfileIdDraft] = useState<string | null>(
    null,
  );
  const [bookmarkMutationProfileIdDraft, setBookmarkMutationProfileIdDraft] = useState<
    string | null
  >(null);

  useEffect(() => {
    const draftState = buildReplayBookmarkDraftState({
      activeReplayBookmark,
      replayActive,
      replayWindowIndex,
      selectedStyleProfileId,
      selectedMutationProfileId,
    });
    setBookmarkLabelDraft(draftState.label);
    setBookmarkNoteDraft(draftState.note);
    setBookmarkTagDraft(draftState.tag);
    setBookmarkStyleProfileIdDraft(draftState.styleProfileId);
    setBookmarkMutationProfileIdDraft(draftState.mutationProfileId);
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

  return {
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
    captureCurrentScene,
  };
}
