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
    <button type="button" onClick={() => notify("success", "Track imported", "Ready for playback")}>
      Trigger toast
    </button>
  );
}

describe("NotificationSystem", () => {
  it("throws when the notification hook is used outside the provider", () => {
    expect(() => render(<NotificationHarness />)).toThrow(
      "useNotify must be used within a NotificationProvider",
    );
  });

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

  it("renders error notifications without a message body", () => {
    function ErrorHarness() {
      const { notify } = useNotify();

      return (
        <button type="button" onClick={() => notify("error", "Stream failed")}>
          Trigger error toast
        </button>
      );
    }

    render(
      <NotificationProvider>
        <ErrorHarness />
      </NotificationProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger error toast" }));

    expect(screen.getByText("Stream failed")).toBeInTheDocument();
    expect(screen.queryByText("Ready for playback")).not.toBeInTheDocument();
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
