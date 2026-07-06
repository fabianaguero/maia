import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MonitorActiveHeader } from "../../../src/features/simple/MonitorActiveHeader";

vi.mock("../../../src/components/Branding", () => ({
  BrandIcon: (props: { className?: string }) => (
    <div data-testid="brand-icon" data-class={props.className} />
  ),
}));

vi.mock("../../../src/i18n/I18nContext", () => ({
  useT: () => ({
    workspace: "Maia",
    simpleMode: {
      monitor: {
        waitingHandshake: "Waiting for stream handshake",
        showFullStream: "Show full stream",
        filterAnomalies: "Focus anomaly rows",
      },
      common: {
        stop: "Stop",
        endSession: "End session",
      },
    },
  }),
}));

describe("MonitorActiveHeader", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders pending state copy and localized stop/filter controls", () => {
    const onToggleAnomalyFilter = vi.fn();
    const onStop = vi.fn();

    render(
      <MonitorActiveHeader
        monitorSourceTitle="services"
        monitorSourcePath="gcp-cloud-run://project/services"
        statusLabel="Connecting stream"
        statusTone="pending"
        isAnomalyFilterActive={false}
        metrics={[
          { key: "anomalies", label: "Anomalies", value: "4", tone: "alert" },
          { key: "uptime", label: "Uptime", value: "15s", tone: "neutral" },
        ]}
        onToggleAnomalyFilter={onToggleAnomalyFilter}
        onStop={onStop}
      />,
    );

    expect(screen.getByText("Waiting for stream handshake")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "End session" })).toHaveTextContent("Stop");
    expect(screen.getByTitle("Focus anomaly rows")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Focus anomaly rows"));
    fireEvent.click(screen.getByRole("button", { name: "End session" }));

    expect(onToggleAnomalyFilter).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("switches the anomaly metric tooltip when the filter is active", () => {
    render(
      <MonitorActiveHeader
        monitorSourceTitle="visits-service"
        monitorSourcePath="/logs/visits-service.log"
        statusLabel="System active"
        statusTone="live"
        isAnomalyFilterActive={true}
        metrics={[{ key: "anomalies", label: "Anomalies", value: "2", tone: "alert" }]}
        onToggleAnomalyFilter={vi.fn()}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByTitle("Show full stream")).toBeInTheDocument();
    expect(screen.queryByText("Waiting for stream handshake")).not.toBeInTheDocument();
  });
});
