import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReplayFeedbackSummaryCard } from "../../src/components/ReplayFeedbackSummaryCard";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import type { ReplayFeedbackRecommendation } from "../../src/utils/replayFeedback";

afterEach(() => {
  cleanup();
});

function createRecommendation(
  overrides: Partial<ReplayFeedbackRecommendation> = {},
): ReplayFeedbackRecommendation {
  return {
    bookmarkCount: 4,
    dominantTag: "good-alerting",
    dominantTagLabel: "Good alerting",
    suggestedStyleProfileId: "steady-house",
    suggestedMutationProfileId: "balanced",
    summary: "Replay feedback likes the current alert presence.",
    detail: "Alerting moments stayed readable without losing the groove.",
    isAligned: false,
    tagSummaries: [
      { tag: "good-alerting", label: "Good alerting", count: 3 },
      { tag: "smooth-bed", label: "Smooth bed", count: 1 },
    ],
    ...overrides,
  };
}

function renderCard(recommendation: ReplayFeedbackRecommendation, extraProps = {}) {
  return render(
    <I18nContext.Provider value={en}>
      <ReplayFeedbackSummaryCard recommendation={recommendation} {...extraProps} />
    </I18nContext.Provider>,
  );
}

describe("ReplayFeedbackSummaryCard", () => {
  it("renders replay recommendation metadata, tags, and action", () => {
    const onApply = vi.fn();

    renderCard(createRecommendation(), {
      title: "Replay guide",
      className: "custom-card",
      actionLabel: "Apply mix",
      onApply,
    });

    expect(screen.getByText("Replay guide")).toBeInTheDocument();
    expect(
      screen.getByText("Replay feedback likes the current alert presence."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Alerting moments stayed readable without losing the groove."),
    ).toBeInTheDocument();
    expect(screen.getByText("4 saved windows")).toBeInTheDocument();
    expect(screen.getByText("Steady House")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByText("Good alerting")).toBeInTheDocument();
    expect(screen.getByText("Smooth bed · 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Apply mix" }));
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("falls back to the localized title and omits optional sections when absent", () => {
    renderCard(
      createRecommendation({
        dominantTag: null,
        dominantTagLabel: null,
        tagSummaries: [],
      }),
      {
        actionLabel: "Apply mix",
        actionDisabled: true,
      },
    );

    expect(screen.getByText(en.session.replayFeedbackTitle)).toBeInTheDocument();
    expect(screen.queryByText("Good alerting")).not.toBeInTheDocument();
    expect(screen.queryByText("Smooth bed · 1")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Apply mix" })).not.toBeInTheDocument();
  });
});
