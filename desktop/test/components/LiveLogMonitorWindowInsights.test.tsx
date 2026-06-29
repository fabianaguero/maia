import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveLogMonitorWindowInsights } from "../../src/features/analyzer/components/LiveLogMonitorWindowInsights";

describe("LiveLogMonitorWindowInsights", () => {
  it("renders summary, metrics, components and trace content", () => {
    render(
      <LiveLogMonitorWindowInsights
        summaryLabel="Current window summary"
        summary="2 anomalies, 4 cues emitted"
        metrics={[
          { label: "Suggested BPM", value: "126" },
          { label: "Errors", value: "2" },
        ]}
        activeComponentsTitle="Active components"
        activeComponentsCopy="Recent hot spots"
        activeComponents={[
          { component: "payments", count: 4 },
          { component: "checkout", count: 2 },
        ]}
        tracePanel={<div>Trace panel host</div>}
      />,
    );

    expect(screen.getByText("Current window summary")).toBeTruthy();
    expect(screen.getByText("2 anomalies, 4 cues emitted")).toBeTruthy();
    expect(screen.getByText("Suggested BPM")).toBeTruthy();
    expect(screen.getByText("payments · 4")).toBeTruthy();
    expect(screen.getByText("Trace panel host")).toBeTruthy();
  });
});
