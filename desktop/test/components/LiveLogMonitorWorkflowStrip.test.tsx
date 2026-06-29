import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveLogMonitorWorkflowStrip } from "../../src/features/analyzer/components/LiveLogMonitorWorkflowStrip";

describe("LiveLogMonitorWorkflowStrip", () => {
  it("renders ordered workflow steps", () => {
    render(
      <LiveLogMonitorWorkflowStrip
        steps={[
          { label: "Base bed", active: true },
          { label: "Source feed", active: false },
          { label: "Scene", active: true },
          { label: "Run", active: false },
        ]}
      />,
    );

    expect(screen.getByText("Base bed").className).toContain("active");
    expect(screen.getByText("Source feed").className).not.toContain("active");
    expect(screen.getByText("Scene").className).toContain("active");
    expect(screen.getByText("Run")).toBeTruthy();
  });
});
