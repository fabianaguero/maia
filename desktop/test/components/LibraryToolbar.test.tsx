import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LibraryToolbar } from "../../src/features/library/components/LibraryToolbar";

describe("LibraryToolbar", () => {
  it("renders toolbar copy and dispatches action clicks", () => {
    const primaryAction = vi.fn();
    const secondaryAction = vi.fn();

    render(
      <LibraryToolbar
        eyebrow="Tracks"
        count="12"
        title="Track catalog"
        note="Ready for selection"
        actions={[
          {
            id: "import-track",
            label: "Import",
            icon: <span data-testid="import-icon">+</span>,
            className: "action",
            onClick: primaryAction,
          },
          {
            id: "cleanup-track",
            label: "Clean",
            icon: <span data-testid="cleanup-icon">x</span>,
            className: "secondary-action",
            onClick: secondaryAction,
          },
        ]}
      />,
    );

    expect(screen.getByText("Tracks")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Track catalog")).toBeInTheDocument();
    expect(screen.getByText("Ready for selection")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /import/i }));
    fireEvent.click(screen.getByRole("button", { name: /clean/i }));

    expect(primaryAction).toHaveBeenCalledTimes(1);
    expect(secondaryAction).toHaveBeenCalledTimes(1);
  });
});
