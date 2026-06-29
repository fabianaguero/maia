import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InspectEmptyState } from "../../src/features/inspect/InspectEmptyState";

describe("InspectEmptyState", () => {
  it("renders title, description, and optional action", () => {
    const onAction = vi.fn();

    render(
      <InspectEmptyState
        eyebrow="Inspect"
        title="Nothing here"
        description="Import something first"
        actionLabel="Go"
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByText("Go"));

    expect(screen.getByText("Nothing here")).toBeTruthy();
    expect(screen.getByText("Import something first")).toBeTruthy();
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
