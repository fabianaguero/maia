import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LibraryEmptyState } from "../../src/features/library/components/LibraryEmptyState";

describe("LibraryEmptyState", () => {
  it("renders icon, copy, and action content", () => {
    render(
      <LibraryEmptyState
        icon={<span data-testid="empty-icon">icon</span>}
        title="No tracks yet"
        body="Import a guide track to start building a deck."
        action={<button type="button">Import track</button>}
      />,
    );

    expect(screen.getByTestId("empty-icon")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No tracks yet" })).toBeInTheDocument();
    expect(screen.getByText("Import a guide track to start building a deck.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import track" })).toBeInTheDocument();
  });
});
