import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LiveLogMonitorDeckSection } from "../../src/features/analyzer/components/LiveLogMonitorDeckSection";

vi.mock("../../src/features/analyzer/components/LiveMonitorMutationTracePanel", () => ({
  LiveMonitorMutationTracePanel: () => <div data-testid="trace-panel">trace</div>,
}));

vi.mock("../../src/features/analyzer/components/PadSequencerPanel", () => ({
  PadSequencerPanel: () => <div data-testid="sequencer-panel">sequencer</div>,
}));

vi.mock("../../src/features/analyzer/components/LiveLogMonitorActiveDeck", () => ({
  LiveLogMonitorActiveDeck: ({
    windowInsightsProps,
    performanceSummaryProps,
  }: {
    windowInsightsProps: { tracePanel: React.ReactNode };
    performanceSummaryProps: { sequencerPanel: React.ReactNode };
  }) => (
    <div data-testid="active-deck">
      {windowInsightsProps.tracePanel}
      {performanceSummaryProps.sequencerPanel}
    </div>
  ),
}));

describe("LiveLogMonitorDeckSection", () => {
  it("composes trace and sequencer panels through the active deck wrapper", () => {
    render(
      <LiveLogMonitorDeckSection
        hasUpdate
        emptyStateLabel="Waiting"
        activityPanelProps={{} as never}
        windowSummaryLabel="Window"
        windowSummary="Stable"
        windowMetrics={[]}
        activeComponentsTitle="Components"
        activeComponentsCopy="Copy"
        activeComponents={[]}
        tracePanelProps={{} as never}
        performanceSummaryProps={
          {
            recentVoices: [],
            recentCues: [],
            recentMarkers: [],
            recentWarnings: [],
            error: null,
            labels: {},
          } as never
        }
        sequencerPanelProps={{ bpm: 126, recentVoices: [] }}
      />,
    );

    expect(screen.getByTestId("active-deck")).toBeInTheDocument();
    expect(screen.getByTestId("trace-panel")).toBeInTheDocument();
    expect(screen.getByTestId("sequencer-panel")).toBeInTheDocument();
  });
});
