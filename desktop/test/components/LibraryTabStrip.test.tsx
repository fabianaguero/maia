import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LibraryTabStrip } from "../../src/features/library/LibraryTabStrip";

describe("LibraryTabStrip", () => {
  it("renders tabs and forwards the selected tab change", () => {
    const onTabChange = vi.fn();

    render(
      <LibraryTabStrip
        activeTab="tracks"
        onTabChange={onTabChange}
        tabs={[
          { id: "tracks", label: "Tracks", count: 2 },
          { id: "connections", label: "Connections", count: 1 },
        ]}
      />,
    );

    expect(screen.getByRole("tab", { name: /Tracks/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Connections/i })).toHaveAttribute(
      "aria-selected",
      "false",
    );

    fireEvent.click(screen.getByRole("tab", { name: /Connections/i }));
    expect(onTabChange).toHaveBeenCalledWith("connections");
  });
});
