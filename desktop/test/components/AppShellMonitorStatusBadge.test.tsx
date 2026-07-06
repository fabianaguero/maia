import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShellMonitorStatusBadge } from "../../src/components/AppShellMonitorStatusBadge";

afterEach(() => {
  cleanup();
});

describe("AppShellMonitorStatusBadge", () => {
  it("renders source, metrics, and dispatches actions", () => {
    const onInspect = vi.fn();
    const onStopMonitoring = vi.fn();

    render(
      <AppShellMonitorStatusBadge
        liveStatusLabel="System active"
        anomaliesInlineLabel="anomalies"
        anomalies={7}
        uptime="01:24"
        source="services.log"
        inspectLabel="Inspect"
        stopLabel="Stop"
        onInspect={onInspect}
        onStopMonitoring={onStopMonitoring}
      />,
    );

    expect(screen.getByText("System active")).toBeInTheDocument();
    expect(screen.getByText("7 anomalies")).toBeInTheDocument();
    expect(screen.getByText("01:24")).toBeInTheDocument();
    expect(screen.getByText("services.log")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));

    expect(onInspect).toHaveBeenCalledTimes(1);
    expect(onStopMonitoring).toHaveBeenCalledTimes(1);
  });

  it("hides the source row and tolerates missing callbacks", () => {
    render(
      <AppShellMonitorStatusBadge
        liveStatusLabel="Armed"
        anomaliesInlineLabel="alerts"
        inspectLabel="Inspect"
        stopLabel="Stop"
      />,
    );

    expect(screen.queryByText("services.log")).not.toBeInTheDocument();
    expect(screen.getByText("0 alerts")).toBeInTheDocument();
    expect(screen.getByText("00:00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Inspect" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  });
});
