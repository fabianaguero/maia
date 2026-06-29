import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProMonitorScreen } from "../../../src/features/simple/ProMonitorScreen";
import { buildProMonitorMockData } from "../../../src/features/simple/proMonitorMockData";
import { en } from "../../../src/i18n/en";

describe("ProMonitorScreen", () => {
  it("renders the live deck shell and toggles playback state", () => {
    render(<ProMonitorScreen />);

    expect(
      screen.getByRole("heading", { name: en.simpleMode.proMonitor.demoSessionTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.simpleMode.proMonitor.warningSpike)).toBeInTheDocument();

    const pauseButton = screen.getByRole("button", { name: en.simpleMode.proMonitor.pause });
    expect(pauseButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(pauseButton);

    const playButton = screen.getByRole("button", { name: en.simpleMode.proMonitor.play });
    expect(playButton).toHaveAttribute("aria-pressed", "false");
  });

  it("adds a custom bookmark from the action button", () => {
    const mockData = buildProMonitorMockData(en);
    const { container } = render(<ProMonitorScreen />);
    const bookmarkCount = () => container.querySelector(".bookmark-count")?.textContent;
    const bookmarkRows = () => container.querySelectorAll(".bookmark-row");
    const addBookmarkButton = () =>
      container.querySelector(".btn-add-bookmark") as HTMLButtonElement;

    expect(bookmarkCount()).toBe(String(mockData.bookmarks.length));
    expect(bookmarkRows()).toHaveLength(mockData.bookmarks.length);

    fireEvent.click(addBookmarkButton());

    expect(bookmarkCount()).toBe(String(mockData.bookmarks.length + 1));
    expect(bookmarkRows()).toHaveLength(mockData.bookmarks.length + 1);
  });
});
