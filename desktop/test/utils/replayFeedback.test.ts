import { describe, expect, it } from "vitest";

import type { SessionBookmark } from "../../src/api/sessions";
import { deriveReplayFeedbackRecommendation } from "../../src/utils/replayFeedback";

function createBookmark(
  overrides: Partial<SessionBookmark> = {},
): SessionBookmark {
  return {
    id: overrides.id ?? 1,
    sessionId: overrides.sessionId ?? "session-1",
    replayWindowIndex: overrides.replayWindowIndex ?? 1,
    eventIndex: overrides.eventIndex ?? 1,
    label: overrides.label ?? "Window",
    note: overrides.note ?? "",
    bookmarkTag: overrides.bookmarkTag ?? null,
    suggestedStyleProfileId: overrides.suggestedStyleProfileId ?? null,
    suggestedMutationProfileId: overrides.suggestedMutationProfileId ?? null,
    trackId: overrides.trackId ?? null,
    trackTitle: overrides.trackTitle ?? null,
    trackSecond: overrides.trackSecond ?? null,
    createdAt: overrides.createdAt ?? "2026-04-09T12:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-04-09T12:01:00.000Z",
  };
}

describe("replay feedback recommendation", () => {
  it("prefers explicit profile hints from bookmarks", () => {
    const recommendation = deriveReplayFeedbackRecommendation([
      createBookmark({
        id: 1,
        replayWindowIndex: 2,
        bookmarkTag: "good-alerting",
        suggestedStyleProfileId: "alert-techno",
        suggestedMutationProfileId: "reactive",
      }),
      createBookmark({
        id: 2,
        replayWindowIndex: 4,
        bookmarkTag: "deploy-transition",
        suggestedStyleProfileId: "alert-techno",
        suggestedMutationProfileId: "reactive",
      }),
      createBookmark({
        id: 3,
        replayWindowIndex: 5,
        bookmarkTag: "good-alerting",
      }),
    ]);

    expect(recommendation).toEqual(
      expect.objectContaining({
        suggestedStyleProfileId: "alert-techno",
        suggestedMutationProfileId: "reactive",
        dominantTag: "good-alerting",
      }),
    );
    expect(recommendation?.tagSummaries[0]).toEqual({
      tag: "good-alerting",
      label: "Good alerting",
      count: 2,
    });
  });

  it("leans toward a quieter mix when bookmarks ask for more space", () => {
    const recommendation = deriveReplayFeedbackRecommendation([
      createBookmark({ id: 1, replayWindowIndex: 1, bookmarkTag: "too-noisy" }),
      createBookmark({ id: 2, replayWindowIndex: 2, bookmarkTag: "needs-space" }),
      createBookmark({ id: 3, replayWindowIndex: 3, bookmarkTag: "smooth-bed" }),
    ]);

    expect(recommendation).toEqual(
      expect.objectContaining({
        suggestedStyleProfileId: "ambient-watch",
        suggestedMutationProfileId: "subtle",
      }),
    );
    expect(recommendation?.summary).toContain("quieter");
  });

  it("marks the recommendation as aligned when the current scene already matches", () => {
    const recommendation = deriveReplayFeedbackRecommendation(
      [
        createBookmark({
          id: 1,
          replayWindowIndex: 7,
          bookmarkTag: "good-alerting",
          suggestedStyleProfileId: "steady-house",
          suggestedMutationProfileId: "balanced",
        }),
      ],
      {
        currentStyleProfileId: "steady-house",
        currentMutationProfileId: "balanced",
      },
    );

    expect(recommendation?.isAligned).toBe(true);
  });
});
