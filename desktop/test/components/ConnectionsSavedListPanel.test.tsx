import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConnectionsSavedListPanel } from "../../src/features/simple/ConnectionsSavedListPanel";
import type { LogSourceConnection } from "../../src/types/monitor";

afterEach(() => {
  cleanup();
});

function makeConnection(overrides: Partial<LogSourceConnection> = {}): LogSourceConnection {
  return {
    id: "conn-1",
    kind: "gcp_cloud_run",
    label: "services",
    sourceUri: "gcp-cloud-run://proj/us-central1/services",
    enabled: true,
    adapterKind: "process",
    config: { backfillFreshness: "120m" },
    lastCursor: 0,
    lastSeenAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("ConnectionsSavedListPanel", () => {
  it("renders empty state and refresh control", () => {
    const onRefreshConnections = vi.fn();

    render(
      <ConnectionsSavedListPanel
        loading={false}
        connections={[]}
        editingConnectionId={null}
        connectionKindLabel={{ file_log: "File log", gcp_cloud_run: "GCloud / Cloud Run" }}
        activeConnectionId={null}
        activeSessionId={null}
        saving={false}
        testStatusById={{}}
        testMessageById={{}}
        tailStatus={null}
        tailPreview={[]}
        onRefreshConnections={onRefreshConnections}
        onSelectConnection={vi.fn()}
        onStartTail={vi.fn()}
        onStopTail={vi.fn()}
        onEditConnection={vi.fn()}
        onTestConnection={vi.fn()}
        onDeleteConnection={vi.fn()}
      />,
    );

    expect(screen.getByText("No persistent connections yet")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Refresh connections"));
    expect(onRefreshConnections).toHaveBeenCalled();
  });

  it("renders a connection row and dispatches row/button actions independently", () => {
    const connection = makeConnection();
    const onSelectConnection = vi.fn();
    const onStartTail = vi.fn();
    const onEditConnection = vi.fn();
    const onTestConnection = vi.fn();
    const onDeleteConnection = vi.fn();

    render(
      <ConnectionsSavedListPanel
        loading={false}
        connections={[connection]}
        editingConnectionId={null}
        connectionKindLabel={{ file_log: "File log", gcp_cloud_run: "GCP Cloud Run" }}
        activeConnectionId={null}
        activeSessionId={null}
        saving={false}
        testStatusById={{ "conn-1": "success" }}
        testMessageById={{ "conn-1": "OK" }}
        tailStatus={null}
        tailPreview={[]}
        onRefreshConnections={vi.fn()}
        onSelectConnection={onSelectConnection}
        onStartTail={onStartTail}
        onStopTail={vi.fn()}
        onEditConnection={onEditConnection}
        onTestConnection={onTestConnection}
        onDeleteConnection={onDeleteConnection}
      />,
    );

    expect(screen.getByText("services")).toBeInTheDocument();
    expect(screen.getByText("GCP Cloud Run")).toBeInTheDocument();
    expect(screen.getByText(/Stream lookback: 120m/i)).toBeInTheDocument();
    expect(screen.getByText("Process")).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();

    fireEvent.click(screen.getByText("services"));
    fireEvent.keyDown(screen.getByRole("button", { name: "Edit connection: services" }), {
      key: "Enter",
    });
    fireEvent.click(screen.getByTitle("Start live tail"));
    fireEvent.click(screen.getByTitle("Edit connection"));
    fireEvent.click(screen.getByTitle("Test persistent connection"));
    fireEvent.click(screen.getByTitle("Delete connection"));

    expect(onSelectConnection).toHaveBeenNthCalledWith(1, connection);
    expect(onSelectConnection).toHaveBeenNthCalledWith(2, connection);
    expect(onStartTail).toHaveBeenCalledWith(connection);
    expect(onEditConnection).toHaveBeenCalledWith(connection);
    expect(onTestConnection).toHaveBeenCalledWith(connection);
    expect(onDeleteConnection).toHaveBeenCalledWith("conn-1");
  });

  it("shows active tail preview and stop action for the live connection", () => {
    const onStopTail = vi.fn();

    render(
      <ConnectionsSavedListPanel
        loading={false}
        connections={[makeConnection()]}
        editingConnectionId="conn-1"
        connectionKindLabel={{ file_log: "File log", gcp_cloud_run: "GCP Cloud Run" }}
        activeConnectionId="conn-1"
        activeSessionId="session-1"
        saving={false}
        testStatusById={{}}
        testMessageById={{}}
        tailStatus="2 lines · 0 anomalies"
        tailPreview={["line 1", "line 2"]}
        onRefreshConnections={vi.fn()}
        onSelectConnection={vi.fn()}
        onStartTail={vi.fn()}
        onStopTail={onStopTail}
        onEditConnection={vi.fn()}
        onTestConnection={vi.fn()}
        onDeleteConnection={vi.fn()}
      />,
    );

    expect(screen.getByText("Live tail")).toBeInTheDocument();
    expect(screen.getByText("2 lines · 0 anomalies")).toBeInTheDocument();
    expect(screen.getByText(/line 1/)).toBeInTheDocument();
    expect(screen.getByText(/line 2/)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Stop live tail"));
    expect(onStopTail).toHaveBeenCalled();
  });
});
