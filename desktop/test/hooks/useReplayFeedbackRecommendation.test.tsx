import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";

import type { SessionBookmark } from "../../src/api/sessions";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import { es } from "../../src/i18n/es";
import { useReplayFeedbackRecommendation } from "../../src/hooks/useReplayFeedbackRecommendation";

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

describe("useReplayFeedbackRecommendation", () => {
  it("returns null without bookmarks and uses translated copy when data exists", () => {
    const esWrapper = ({ children }: PropsWithChildren) => (
      <I18nContext.Provider value={es}>{children}</I18nContext.Provider>
    );

    const emptyView = renderHook(() => useReplayFeedbackRecommendation([]), {
      wrapper: esWrapper,
    });
    expect(emptyView.result.current).toBeNull();

    const translatedView = renderHook(
      () =>
        useReplayFeedbackRecommendation([
          createBookmark({ id: 1, replayWindowIndex: 1, bookmarkTag: "good-alerting" }),
          createBookmark({ id: 2, replayWindowIndex: 2, bookmarkTag: "good-alerting" }),
        ]),
      {
        wrapper: esWrapper,
      },
    );

    expect(translatedView.result.current).toEqual(
      expect.objectContaining({
        dominantTag: "good-alerting",
        summary: es.session.replayFeedbackAlertSummary,
      }),
    );
    expect(translatedView.result.current?.detail).toContain("Steady House");
  });

  it("recomputes when translation or current profile options change", () => {
    const bookmarks = [
      createBookmark({
        id: 10,
        replayWindowIndex: 3,
        bookmarkTag: "good-alerting",
        suggestedStyleProfileId: "steady-house",
        suggestedMutationProfileId: "balanced",
      }),
    ];

    let translations = en;
    const wrapper = ({ children }: PropsWithChildren) => (
      <I18nContext.Provider value={translations}>{children}</I18nContext.Provider>
    );

    const view = renderHook(
      ({
        currentStyleProfileId,
        currentMutationProfileId,
      }: {
        currentStyleProfileId?: string | null;
        currentMutationProfileId?: string | null;
      }) =>
        useReplayFeedbackRecommendation(bookmarks, {
          currentStyleProfileId,
          currentMutationProfileId,
        }),
      {
        initialProps: {
          currentStyleProfileId: null,
          currentMutationProfileId: null,
        },
        wrapper,
      },
    );

    expect(view.result.current).toEqual(
      expect.objectContaining({
        summary: en.session.replayFeedbackAlertSummary,
        isAligned: false,
      }),
    );

    translations = es;
    view.rerender({
      currentStyleProfileId: "steady-house",
      currentMutationProfileId: "balanced",
    });

    expect(view.result.current).toEqual(
      expect.objectContaining({
        summary: es.session.replayFeedbackAlertSummary,
        isAligned: true,
      }),
    );
  });
});
