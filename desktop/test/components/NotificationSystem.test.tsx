import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NotificationProvider, useNotify } from "../../src/components/NotificationSystem";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function NotificationHarness() {
  const { notify } = useNotify();

  return (
    <button
      type="button"
      onClick={() => notify("success", "Track imported", "Ready for playback")}
    >
      Trigger toast
    </button>
  );
}

describe("NotificationSystem", () => {
  it("renders and dismisses notifications", () => {
    render(
      <NotificationProvider>
        <NotificationHarness />
      </NotificationProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger toast" }));

    expect(screen.getByText("Track imported")).toBeInTheDocument();
    expect(screen.getByText("Ready for playback")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));

    expect(screen.queryByText("Track imported")).not.toBeInTheDocument();
  });

  it("auto-removes notifications after the timeout", () => {
    vi.useFakeTimers();

    render(
      <NotificationProvider>
        <NotificationHarness />
      </NotificationProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger toast" }));
    expect(screen.getByText("Track imported")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText("Track imported")).not.toBeInTheDocument();
  });
});
