import { describe, expect, it } from "vitest";

import type { SessionBookmark } from "../../src/api/sessions";
import { deriveReplayFeedbackRecommendation } from "../../src/utils/replayFeedback";

function createBookmark(overrides: Partial<SessionBookmark> = {}): SessionBookmark {
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
  it("returns null when there are no replay bookmarks", () => {
    expect(deriveReplayFeedbackRecommendation([])).toBeNull();
  });

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

  it("uses inferred profiles and custom labels for dominant deploy and smooth-bed feedback", () => {
    const deployRecommendation = deriveReplayFeedbackRecommendation(
      [
        createBookmark({ id: 1, replayWindowIndex: 1, bookmarkTag: "deploy-transition" }),
        createBookmark({ id: 2, replayWindowIndex: 2, bookmarkTag: "deploy-transition" }),
        createBookmark({ id: 3, replayWindowIndex: 3, bookmarkTag: "good-alerting" }),
      ],
      {
        currentStyleProfileId: "steady-house",
        currentMutationProfileId: "balanced",
        labels: {
          balancedSummary: "balanced",
          balancedDetail: "{style}/{mutation}",
          quieterSummary: "quiet",
          quieterDetail: "{count}/{total} {style}/{mutation}",
          sharperSummary: "sharp",
          sharperDetail: "{style}/{mutation}",
          alertSummary: "alert",
          alertDetail: "{style}/{mutation}",
          smoothSummary: "smooth",
          smoothDetail: "{style}/{mutation}",
        },
      },
    );

    expect(deployRecommendation).toEqual(
      expect.objectContaining({
        dominantTag: "deploy-transition",
        suggestedStyleProfileId: "alert-techno",
        suggestedMutationProfileId: "reactive",
        summary: "sharp",
        detail: expect.stringContaining("/"),
        isAligned: false,
      }),
    );

    const smoothRecommendation = deriveReplayFeedbackRecommendation([
      createBookmark({ id: 10, replayWindowIndex: 4, bookmarkTag: "smooth-bed" }),
      createBookmark({ id: 11, replayWindowIndex: 5, bookmarkTag: "smooth-bed" }),
    ]);

    expect(smoothRecommendation).toEqual(
      expect.objectContaining({
        dominantTag: "smooth-bed",
        dominantTagLabel: "Smooth bed",
        suggestedStyleProfileId: "ambient-watch",
        suggestedMutationProfileId: "subtle",
      }),
    );
    expect(smoothRecommendation?.summary).toContain("quieter");
  });

  it("falls back to defaults when tags are missing and still summarizes known tags deterministically", () => {
    const recommendation = deriveReplayFeedbackRecommendation([
      createBookmark({ id: 1, replayWindowIndex: 1, bookmarkTag: null }),
      createBookmark({ id: 2, replayWindowIndex: 2, bookmarkTag: "unknown-tag" }),
      createBookmark({ id: 3, replayWindowIndex: 3, bookmarkTag: "unknown-tag" }),
    ]);

    expect(recommendation).toEqual(
      expect.objectContaining({
        dominantTag: "unknown-tag",
        dominantTagLabel: "unknown-tag",
        suggestedStyleProfileId: "steady-house",
        suggestedMutationProfileId: "balanced",
      }),
    );
    expect(recommendation?.tagSummaries).toEqual([
      { tag: "unknown-tag", label: "unknown-tag", count: 2 },
    ]);
  });

  it("uses the alerting branch when good-alerting dominates without explicit profile hints", () => {
    const recommendation = deriveReplayFeedbackRecommendation([
      createBookmark({ id: 1, replayWindowIndex: 1, bookmarkTag: "good-alerting" }),
      createBookmark({ id: 2, replayWindowIndex: 2, bookmarkTag: "good-alerting" }),
      createBookmark({ id: 3, replayWindowIndex: 3, bookmarkTag: "deploy-transition" }),
    ]);

    expect(recommendation).toEqual(
      expect.objectContaining({
        dominantTag: "good-alerting",
        suggestedStyleProfileId: "steady-house",
        suggestedMutationProfileId: "balanced",
      }),
    );
    expect(recommendation?.summary).toContain("alert presence");
    expect(recommendation?.detail).toContain("recommended carry-forward mix");
  });

  it("infers deep-night for pure too-noisy feedback and handles bookmarks with no tags at all", () => {
    const noisyRecommendation = deriveReplayFeedbackRecommendation([
      createBookmark({ id: 1, replayWindowIndex: 1, bookmarkTag: "too-noisy" }),
      createBookmark({ id: 2, replayWindowIndex: 2, bookmarkTag: "too-noisy" }),
    ]);

    expect(noisyRecommendation).toEqual(
      expect.objectContaining({
        dominantTag: "too-noisy",
        suggestedStyleProfileId: "deep-night",
        suggestedMutationProfileId: "subtle",
      }),
    );

    const untaggedRecommendation = deriveReplayFeedbackRecommendation([
      createBookmark({ id: 10, replayWindowIndex: 1, bookmarkTag: null }),
      createBookmark({ id: 11, replayWindowIndex: 2, bookmarkTag: null }),
    ]);

    expect(untaggedRecommendation).toEqual(
      expect.objectContaining({
        dominantTag: null,
        dominantTagLabel: null,
        suggestedStyleProfileId: "steady-house",
        suggestedMutationProfileId: "balanced",
        tagSummaries: [],
      }),
    );
    expect(untaggedRecommendation?.summary).toContain("balanced");
  });

  it("infers subtle for needs-space when stronger tags balance the total", () => {
    const recommendation = deriveReplayFeedbackRecommendation([
      createBookmark({ id: 1, replayWindowIndex: 1, bookmarkTag: "needs-space" }),
      createBookmark({ id: 2, replayWindowIndex: 2, bookmarkTag: "needs-space" }),
      createBookmark({ id: 3, replayWindowIndex: 3, bookmarkTag: "good-alerting" }),
      createBookmark({ id: 4, replayWindowIndex: 4, bookmarkTag: "deploy-transition" }),
    ]);

    expect(recommendation).toEqual(
      expect.objectContaining({
        dominantTag: "needs-space",
        suggestedStyleProfileId: "ambient-watch",
        suggestedMutationProfileId: "subtle",
        summary: "Replay feedback is balanced.",
        detail: expect.stringContaining("Ambient Watch + Subtle"),
      }),
    );
  });

  it("renders custom quieter copy when replay bookmarks ask for more space", () => {
    const recommendation = deriveReplayFeedbackRecommendation(
      [
        createBookmark({ id: 20, replayWindowIndex: 1, bookmarkTag: "too-noisy" }),
        createBookmark({ id: 21, replayWindowIndex: 2, bookmarkTag: "needs-space" }),
        createBookmark({ id: 22, replayWindowIndex: 3, bookmarkTag: "smooth-bed" }),
      ],
      {
        labels: {
          balancedSummary: "balanced",
          balancedDetail: "{style}/{mutation}",
          quieterSummary: "quieter-custom",
          quieterDetail: "{count}/{total}::{style}/{mutation}",
          sharperSummary: "sharp",
          sharperDetail: "{style}/{mutation}",
          alertSummary: "alert",
          alertDetail: "{style}/{mutation}",
          smoothSummary: "smooth",
          smoothDetail: "{style}/{mutation}",
        },
      },
    );

    expect(recommendation).toEqual(
      expect.objectContaining({
        summary: "quieter-custom",
        detail: expect.stringContaining("3/3::"),
      }),
    );
  });

  it("uses default deploy detail, custom alert detail, and the smooth-bed branch when totals are balanced", () => {
    const deployRecommendation = deriveReplayFeedbackRecommendation([
      createBookmark({ id: 1, replayWindowIndex: 1, bookmarkTag: "deploy-transition" }),
      createBookmark({ id: 2, replayWindowIndex: 2, bookmarkTag: "deploy-transition" }),
    ]);

    expect(deployRecommendation?.detail).toContain("felt strongest");

    const alertRecommendation = deriveReplayFeedbackRecommendation(
      [
        createBookmark({ id: 3, replayWindowIndex: 3, bookmarkTag: "good-alerting" }),
        createBookmark({ id: 4, replayWindowIndex: 4, bookmarkTag: "good-alerting" }),
      ],
      {
        labels: {
          balancedSummary: "balanced",
          balancedDetail: "{style}/{mutation}",
          quieterSummary: "quiet",
          quieterDetail: "{count}/{total} {style}/{mutation}",
          sharperSummary: "sharp",
          sharperDetail: "{style}/{mutation}",
          alertSummary: "alert-custom",
          alertDetail: "{style}/{mutation}::alert",
          smoothSummary: "smooth",
          smoothDetail: "{style}/{mutation}",
        },
      },
    );

    expect(alertRecommendation).toEqual(
      expect.objectContaining({
        summary: "alert-custom",
        detail: expect.stringContaining("::alert"),
      }),
    );

    const smoothRecommendation = deriveReplayFeedbackRecommendation([
      createBookmark({ id: 10, replayWindowIndex: 10, bookmarkTag: "smooth-bed" }),
      createBookmark({ id: 11, replayWindowIndex: 11, bookmarkTag: "smooth-bed" }),
      createBookmark({ id: 12, replayWindowIndex: 12, bookmarkTag: "good-alerting" }),
      createBookmark({ id: 13, replayWindowIndex: 13, bookmarkTag: "deploy-transition" }),
    ]);

    expect(smoothRecommendation).toEqual(
      expect.objectContaining({
        dominantTag: "smooth-bed",
        suggestedStyleProfileId: "ambient-watch",
        suggestedMutationProfileId: "subtle",
      }),
    );
    expect(smoothRecommendation?.summary).toContain("smoother bed");
    expect(smoothRecommendation?.detail).toContain("calmer background shape");
  });

  it("renders custom smooth-bed detail when that branch dominates without quieter majority", () => {
    const recommendation = deriveReplayFeedbackRecommendation(
      [
        createBookmark({ id: 30, replayWindowIndex: 1, bookmarkTag: "smooth-bed" }),
        createBookmark({ id: 31, replayWindowIndex: 2, bookmarkTag: "smooth-bed" }),
        createBookmark({ id: 32, replayWindowIndex: 3, bookmarkTag: "good-alerting" }),
        createBookmark({ id: 33, replayWindowIndex: 4, bookmarkTag: "deploy-transition" }),
      ],
      {
        labels: {
          balancedSummary: "balanced",
          balancedDetail: "{style}/{mutation}",
          quieterSummary: "quiet",
          quieterDetail: "{count}/{total} {style}/{mutation}",
          sharperSummary: "sharp",
          sharperDetail: "{style}/{mutation}",
          alertSummary: "alert",
          alertDetail: "{style}/{mutation}",
          smoothSummary: "smooth-custom",
          smoothDetail: "{style}/{mutation}::smooth",
        },
      },
    );

    expect(recommendation).toEqual(
      expect.objectContaining({
        summary: "smooth-custom",
        detail: expect.stringContaining("::smooth"),
      }),
    );
  });
});
