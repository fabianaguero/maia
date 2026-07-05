import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionReplayBookmarkCardProps,
  buildSessionReplayBookmarkPanelSections,
  buildSessionReplayBookmarkContext,
  buildSessionReplayBookmarkMeta,
  buildSessionReplayBookmarkPanelHeader,
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
    const sections = buildSessionReplayBookmarkPanelSections({
      t: en,
      selectedSession: session,
      selectedSessionBookmarks: [bookmark],
      selectedSessionReplayFeedbackRecommendation: null,
      bookmarkContexts: {},
      mutating: false,
      onReplayBookmark: () => undefined,
    });

    expect(cardProps.windowLabel).toContain("4");
    expect(cardProps.context?.excerpt).toBe("burst detected");
    expect(sections.bookmarkCardPropsList).toHaveLength(1);
    expect(sections.emptyLabel).toBe(en.session.noReplayNotesSavedYet);
  });
});
