import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BpmCurvePanel } from "../../src/features/analyzer/components/BpmCurvePanel";

describe("BpmCurvePanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows an empty state when no curve or fallback BPM are available", () => {
    render(<BpmCurvePanel bpmCurve={[]} fallbackBpm={null} durationSeconds={null} />);

    expect(screen.getByText("BPM curve")).toBeInTheDocument();
    expect(
      screen.getByText("No BPM curve points were stored for this track yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "BPM curve" })).not.toBeInTheDocument();
  });

  it("builds a flat fallback curve from the provided BPM and duration", () => {
    const { container } = render(
      <BpmCurvePanel bpmCurve={[]} fallbackBpm={126} durationSeconds={180} />,
    );

    expect(screen.getByRole("img", { name: "BPM curve" })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getAllByText("126.0").length).toBeGreaterThanOrEqual(2);
    expect(container.querySelectorAll(".bpm-curve-dot")).toHaveLength(2);
    expect(container.querySelector(".bpm-curve-line")).toHaveAttribute(
      "d",
      "M 0.00 90.00 L 520.00 90.00",
    );
  });

  it("renders the persisted contour and reports min/max BPM for real curve data", () => {
    const { container } = render(
      <BpmCurvePanel
        bpmCurve={[
          { second: 0, bpm: 124 },
          { second: 30, bpm: 128 },
          { second: 60, bpm: 126 },
        ]}
        fallbackBpm={null}
        durationSeconds={60}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("124.0")).toBeInTheDocument();
    expect(screen.getByText("128.0")).toBeInTheDocument();
    expect(container.querySelectorAll(".bpm-curve-dot")).toHaveLength(3);
    expect(container.querySelector(".bpm-curve-line")?.getAttribute("d")).toContain("L 520.00");
  });
});
