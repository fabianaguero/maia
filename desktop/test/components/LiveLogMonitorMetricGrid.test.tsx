import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveLogMonitorMetricGrid } from "../../src/features/analyzer/components/LiveLogMonitorMetricGrid";

describe("LiveLogMonitorMetricGrid", () => {
  it("renders metric labels and values", () => {
    render(
      <LiveLogMonitorMetricGrid
        items={[
          { label: "Mode", value: "Replay session" },
          { label: "Beat clock", value: "126 BPM" },
        ]}
      />,
    );

    expect(screen.getByText("Mode")).toBeTruthy();
    expect(screen.getByText("Replay session")).toBeTruthy();
    expect(screen.getByText("Beat clock")).toBeTruthy();
    expect(screen.getByText("126 BPM")).toBeTruthy();
  });
});
