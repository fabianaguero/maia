import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionsScreen } from "../../src/features/simple/ConnectionsScreen";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";
import type { LogSourceConnection, StreamSessionPollResult } from "../../src/types/monitor";

const repositoriesMock = vi.hoisted(() => ({
  deleteLogSourceConnection: vi.fn(),
  listLogSourceConnections: vi.fn(),
  pickRepositoryFile: vi.fn(),
  pollStreamSession: vi.fn(),
  startLogSourceConnection: vi.fn(),
  stopStreamSession: vi.fn(),
  upsertLogSourceConnection: vi.fn(),
}));

vi.mock("../../src/api/repositories", () => repositoriesMock);

function createConnection(overrides: Partial<LogSourceConnection> = {}): LogSourceConnection {
  return {
    id: "conn-1",
    kind: "file_log",
    label: "visits-service",
    sourceUri: "/var/log/visits-service.log",
    enabled: true,
    adapterKind: "file",
    config: {
      path: "/var/log/visits-service.log",
    },
    lastCursor: 0,
    lastSeenAt: "2026-06-25T18:00:00.000Z",
    createdAt: "2026-06-25T17:00:00.000Z",
    updatedAt: "2026-06-25T18:00:00.000Z",
    ...overrides,
  };
}

function createPollResult(
  overrides: Partial<StreamSessionPollResult> = {},
): StreamSessionPollResult {
  return {
    session: {
      sessionId: "session-1",
      adapterKind: "file",
      source: "/var/log/visits-service.log",
      label: "visits-service",
      createdAt: "2026-06-25T18:00:00.000Z",
      lastPolledAt: "2026-06-25T18:00:01.000Z",
      totalPolls: 1,
      fileCursor: 128,
    },
    hasData: true,
    summary: "Tail active",
    suggestedBpm: null,
    confidence: 0.5,
    dominantLevel: "info",
    lineCount: 8,
    anomalyCount: 0,
    levelCounts: { INFO: 8 },
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: ["INFO app boot complete"],
    warnings: [],
    ...overrides,
  };
}

function renderScreen() {
  return render(
    <I18nContext.Provider value={en}>
      <ConnectionsScreen />
    </I18nContext.Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

beforeEach(() => {
  repositoriesMock.deleteLogSourceConnection.mockResolvedValue(undefined);
  repositoriesMock.listLogSourceConnections.mockResolvedValue([]);
  repositoriesMock.pickRepositoryFile.mockResolvedValue(null);
  repositoriesMock.pollStreamSession.mockResolvedValue(createPollResult());
  repositoriesMock.startLogSourceConnection.mockResolvedValue(undefined);
  repositoriesMock.stopStreamSession.mockResolvedValue(true);
  repositoriesMock.upsertLogSourceConnection.mockResolvedValue(undefined);
});

describe("ConnectionsScreen", () => {
  it("loads saved connections and hydrates the edit form from a selected row", async () => {
    repositoriesMock.listLogSourceConnections.mockResolvedValue([createConnection()]);

    renderScreen();

    await screen.findByText("visits-service");
    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.connections.editConnection }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("/var/log/visits-service.log")).toBeInTheDocument();
      expect(screen.getByDisplayValue("visits-service")).toBeInTheDocument();
    });
  });

  it("saves a new file connection using the upsert contract", async () => {
    repositoriesMock.listLogSourceConnections
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([createConnection({ label: "app.log", sourceUri: "/tmp/app.log" })]);

    renderScreen();

    await screen.findByText(en.simpleMode.connections.noConnections);
    fireEvent.change(screen.getByLabelText(en.simpleMode.connections.logFilePath), {
      target: { value: "/tmp/app.log" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save connection/i }));

    await waitFor(() => {
      expect(repositoriesMock.upsertLogSourceConnection).toHaveBeenCalledWith({
        id: undefined,
        kind: "file_log",
        label: "app.log",
        sourceUri: "/tmp/app.log",
        config: {
          path: "/tmp/app.log",
        },
      });
    });
    expect(repositoriesMock.listLogSourceConnections).toHaveBeenCalledTimes(2);
  });

  it("tests a persistent file connection and surfaces the adapter result", async () => {
    vi.useFakeTimers();
    repositoriesMock.listLogSourceConnections.mockResolvedValue([createConnection()]);
    repositoriesMock.pollStreamSession.mockResolvedValueOnce(
      createPollResult({
        hasData: true,
        lineCount: 12,
        parsedLines: ["INFO first line", "WARN second line"],
        warnings: [],
      }),
    );

    renderScreen();

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("visits-service")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: en.simpleMode.connections.testPersistentConnection }),
    );

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    expect(screen.getByText("12 lines available from the tail")).toBeInTheDocument();
    expect(repositoriesMock.startLogSourceConnection).toHaveBeenCalledTimes(1);
    expect(repositoriesMock.stopStreamSession).toHaveBeenCalledWith(
      expect.stringMatching(/^test-conn-1-/),
    );
  });

  it("starts and stops the live tail console for the selected connection", async () => {
    vi.useFakeTimers();
    repositoriesMock.listLogSourceConnections.mockResolvedValue([createConnection()]);
    repositoriesMock.pollStreamSession.mockResolvedValue(
      createPollResult({
        lineCount: 2,
        anomalyCount: 1,
        dominantLevel: "warn",
        parsedLines: ["WARN queue depth rising"],
      }),
    );

    renderScreen();

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText("visits-service")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.connections.startLiveTail }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });

    expect(screen.getByText("2 lines · 1 anomalies · warn")).toBeInTheDocument();
    expect(screen.getByText("WARN queue depth rising")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: en.simpleMode.connections.stopLiveTail }));
    expect(repositoriesMock.stopStreamSession).toHaveBeenCalledWith(
      expect.stringMatching(/^conn-conn-1-/),
    );
  });

  it("disables starting another live tail while one connection is already active", async () => {
    vi.useFakeTimers();
    repositoriesMock.listLogSourceConnections.mockResolvedValue([
      createConnection(),
      createConnection({
        id: "conn-2",
        label: "billing-service",
        sourceUri: "/var/log/billing-service.log",
        config: { path: "/var/log/billing-service.log" },
      }),
    ]);

    renderScreen();

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: en.simpleMode.connections.startLiveTail })[0]!,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });

    const startButtons = screen.getAllByRole("button", {
      name: en.simpleMode.connections.startLiveTail,
    });
    expect(startButtons).toHaveLength(1);
    expect(startButtons[0]).toBeDisabled();
    expect(repositoriesMock.startLogSourceConnection).toHaveBeenCalledTimes(1);
  });
});
