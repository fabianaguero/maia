import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useReplayBookmarkDraftState } from "../../src/hooks/useReplayBookmarkDraftState";

describe("useReplayBookmarkDraftState", () => {
  it("syncs drafts from the active bookmark and can recapture the current scene", () => {
    const { result, rerender } = renderHook(
      ({
        activeReplayBookmark,
        selectedStyleProfileId,
        selectedMutationProfileId,
      }: {
        activeReplayBookmark: {
          label: string;
          note: string;
          bookmarkTag: string | null;
          suggestedStyleProfileId: string | null;
          suggestedMutationProfileId: string | null;
        } | null;
        selectedStyleProfileId: string;
        selectedMutationProfileId: string;
      }) =>
        useReplayBookmarkDraftState({
          activeReplayBookmark: activeReplayBookmark as never,
          replayActive: true,
          replayWindowIndex: 3,
          selectedStyleProfileId,
          selectedMutationProfileId,
        }),
      {
        initialProps: {
          activeReplayBookmark: null,
          selectedStyleProfileId: "style-a",
          selectedMutationProfileId: "mutation-a",
        },
      },
    );

    expect(result.current.bookmarkLabelDraft).toBe("Window 3");
    expect(result.current.bookmarkStyleProfileIdDraft).toBe("style-a");

    rerender({
      activeReplayBookmark: {
        label: "Saved Window",
        note: "Keep this",
        bookmarkTag: "alert",
        suggestedStyleProfileId: "style-saved",
        suggestedMutationProfileId: "mutation-saved",
      },
      selectedStyleProfileId: "style-b",
      selectedMutationProfileId: "mutation-b",
    });

    expect(result.current.bookmarkLabelDraft).toBe("Saved Window");
    expect(result.current.bookmarkTagDraft).toBe("alert");

    act(() => {
      result.current.captureCurrentScene();
    });

    expect(result.current.bookmarkStyleProfileIdDraft).toBe("style-b");
    expect(result.current.bookmarkMutationProfileIdDraft).toBe("mutation-b");
  });
});
