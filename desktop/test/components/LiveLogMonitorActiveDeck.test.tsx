import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LiveLogMonitorActiveDeck } from "../../src/features/analyzer/components/LiveLogMonitorActiveDeck";

vi.mock("../../src/features/analyzer/components/LiveLogMonitorActivityPanel", () => ({
  LiveLogMonitorActivityPanel: () => <div>activity-panel</div>,
}));

vi.mock("../../src/features/analyzer/components/LiveLogMonitorWindowInsights", () => ({
  LiveLogMonitorWindowInsights: () => <div>window-insights</div>,
}));

vi.mock("../../src/features/analyzer/components/LiveLogMonitorPerformanceSummary", () => ({
  LiveLogMonitorPerformanceSummary: () => <div>performance-summary</div>,
}));

describe("LiveLogMonitorActiveDeck", () => {
  it("renders the empty state when there is no update yet", () => {
    render(
      <LiveLogMonitorActiveDeck
        hasUpdate={false}
        emptyStateLabel="Start monitoring"
        activityPanelProps={{} as never}
        windowInsightsProps={{} as never}
        performanceSummaryProps={{} as never}
      />,
    );

    expect(screen.getByText("Start monitoring")).toBeTruthy();
  });

  it("renders activity, insights, and performance panels when active", () => {
    render(
      <LiveLogMonitorActiveDeck
        hasUpdate
        emptyStateLabel="Start monitoring"
        activityPanelProps={{} as never}
        windowInsightsProps={{} as never}
        performanceSummaryProps={{} as never}
      />,
    );

    expect(screen.getByText("activity-panel")).toBeTruthy();
    expect(screen.getByText("window-insights")).toBeTruthy();
    expect(screen.getByText("performance-summary")).toBeTruthy();
  });
});
