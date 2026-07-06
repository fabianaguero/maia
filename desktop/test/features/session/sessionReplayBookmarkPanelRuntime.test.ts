import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionReplayBookmarkCardPropsListFromState,
  buildSessionReplayBookmarkCardPropsList,
  buildSessionReplayBookmarkCardProps,
  buildSessionReplayBookmarkCardState,
  buildSessionReplayBookmarkPanelDerivedState,
  buildSessionReplayBookmarkPanelSections,
  buildSessionReplayBookmarkContext,
  buildSessionReplayBookmarkMeta,
  buildSessionReplayBookmarkPanelHeader,
  buildSessionReplayBookmarkRecommendationProps,
  resolveSessionReplayBookmarkDisabled,
} from "../../../src/features/session/sessionReplayBookmarkPanelRuntime";

const session = {
  label: "Night watch",
  totalPolls: 3,
} as never;

const bookmark = {
  id: 1,
  label: "Deploy burst",
  replayWindowIndex: 4,
  note: "",
  bookmarkTag: "good-alerting",
  suggestedStyleProfileId: "steady-house",
  suggestedMutationProfileId: "balanced",
  updatedAt: "2026-06-25T00:00:00.000Z",
  trackTitle: "Base Pulse",
  trackSecond: 32.4,
} as never;

describe("sessionReplayBookmarkPanelRuntime", () => {
  it("builds header, bookmark meta and bookmark context", () => {
    const header = buildSessionReplayBookmarkPanelHeader({
      selectedSession: session,
      t: en,
    });
    const meta = buildSessionReplayBookmarkMeta({
      bookmark,
      t: en,
    });
    const context = buildSessionReplayBookmarkContext({
      context: {
        bpm: 126,
        dominantLevel: "error",
        anomalyCount: 3,
        logExcerpt: "first line",
      },
      t: en,
    });

    expect(header.summary).toContain("Night watch");
    expect(meta.windowLabel).toContain("4");
    expect(meta.note).toBe(en.session.bookmarkNoNote);
    expect(meta.tags.length).toBeGreaterThan(2);
    expect(context?.bpmLabel).toContain("126");
    expect(context?.excerpt).toBe("first line");
  });

  it("resolves replay button disabled state", () => {
    expect(
      resolveSessionReplayBookmarkDisabled({
        mutating: true,
        selectedSession: session,
      }),
    ).toBe(true);
    expect(
      resolveSessionReplayBookmarkDisabled({
        mutating: false,
        selectedSession: { totalPolls: 0 } as never,
      }),
    ).toBe(true);
    expect(
      resolveSessionReplayBookmarkDisabled({
        mutating: false,
        selectedSession: session,
      }),
    ).toBe(false);
  });

  it("builds bookmark card props and panel sections", () => {
    const cardState = buildSessionReplayBookmarkCardState({
      bookmark,
      bookmarkContext: {
        bpm: 126,
        dominantLevel: "warn",
        anomalyCount: 2,
        logExcerpt: "burst detected",
      },
      t: en,
    });
    const cardProps = buildSessionReplayBookmarkCardProps({
      bookmark,
      selectedSession: session,
      bookmarkContext: {
        bpm: 126,
        dominantLevel: "warn",
        anomalyCount: 2,
        logExcerpt: "burst detected",
      },
      replayDisabled: false,
      t: en,
      onReplayBookmark: () => undefined,
    });
    const cardPropsList = buildSessionReplayBookmarkCardPropsList({
      selectedSession: session,
      selectedSessionBookmarks: [bookmark],
      bookmarkContexts: {},
      replayDisabled: false,
      t: en,
      onReplayBookmark: () => undefined,
    });
    const cardPropsListFromState = buildSessionReplayBookmarkCardPropsListFromState({
      selectedSession: session,
      selectedSessionBookmarks: [bookmark],
      bookmarkCardStates: [cardState],
      replayDisabled: false,
      t: en,
      onReplayBookmark: () => undefined,
    });
    const recommendationProps = buildSessionReplayBookmarkRecommendationProps({
      recommendation: { summary: "Keep this groove" } as never,
      t: en,
    });
    const derivedState = buildSessionReplayBookmarkPanelDerivedState({
      t: en,
      selectedSession: session,
      selectedSessionBookmarks: [bookmark],
      selectedSessionReplayFeedbackRecommendation: null,
      bookmarkContexts: {
        1: {
          bpm: 126,
          dominantLevel: "warn",
          anomalyCount: 2,
          logExcerpt: "burst detected",
        },
      },
      mutating: false,
      onReplayBookmark: () => undefined,
    });
    const sections = buildSessionReplayBookmarkPanelSections({
      t: en,
      selectedSession: session,
      selectedSessionBookmarks: [bookmark],
      selectedSessionReplayFeedbackRecommendation: null,
      bookmarkContexts: {},
      mutating: false,
      onReplayBookmark: () => undefined,
    });

    expect(cardState.meta.windowLabel).toContain("4");
    expect(cardProps.windowLabel).toContain("4");
    expect(cardProps.context?.excerpt).toBe("burst detected");
    expect(cardPropsList).toHaveLength(1);
    expect(cardPropsListFromState[0]?.context?.excerpt).toBe("burst detected");
    expect(recommendationProps?.title).toBe(en.session.recommendedMix);
    expect(derivedState.bookmarkCardStates).toHaveLength(1);
    expect(derivedState.replayDisabled).toBe(false);
    expect(sections.bookmarkCardPropsList).toHaveLength(1);
    expect(sections.emptyLabel).toBe(en.session.noReplayNotesSavedYet);
  });
});
