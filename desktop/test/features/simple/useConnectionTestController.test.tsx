import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { useConnectionTestController } from "../../../src/features/simple/useConnectionTestController";
import type { LogSourceConnection, StreamSessionPollResult } from "../../../src/types/monitor";

function createConnection(overrides: Partial<LogSourceConnection> = {}): LogSourceConnection {
  return {
    id: "conn-1",
    kind: "file_log",
    label: "visits-service",
    sourceUri: "/logs/visits-service.log",
    enabled: true,
    adapterKind: "file",
    config: {
      path: "/logs/visits-service.log",
    },
    lastCursor: 0,
    lastSeenAt: null,
    createdAt: "2026-06-26T10:00:00.000Z",
    updatedAt: "2026-06-26T10:05:00.000Z",
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
      source: "/logs/visits-service.log",
      label: "visits-service",
      createdAt: "2026-06-26T10:00:00.000Z",
      lastPolledAt: "2026-06-26T10:00:01.000Z",
      totalPolls: 1,
      fileCursor: 10,
    },
    hasData: true,
    summary: "ready",
    suggestedBpm: null,
    confidence: 0.5,
    dominantLevel: "info",
    lineCount: 12,
    anomalyCount: 0,
    levelCounts: {},
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: ["INFO ok"],
    warnings: [],
    ...overrides,
  };
}

describe("useConnectionTestController", () => {
  it("updates per-connection probe feedback after a successful test", async () => {
    const startLogSourceConnection = vi.fn().mockResolvedValue(undefined);
    const pollStreamSession = vi.fn().mockResolvedValue(createPollResult());
    const stopStreamSession = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => {
      const errors: string[] = [];
      const hook = useConnectionTestController({
        t: en,
        setError: (message) => {
          if (message) {
            errors.push(message);
          }
        },
        startLogSourceConnection,
        pollStreamSession,
        stopStreamSession,
        sleepMs: vi.fn().mockResolvedValue(undefined),
      });

      return {
        ...hook,
        errors,
      };
    });

    await act(async () => {
      await result.current.handleTestConnection(createConnection());
    });

    expect(startLogSourceConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: "conn-1",
        startFromBeginning: false,
      }),
    );
    expect(stopStreamSession).toHaveBeenCalledWith(expect.stringMatching(/^test-conn-1-/));

    await waitFor(() => {
      expect(result.current.testStatusById["conn-1"]).toBe("success");
      expect(result.current.testMessageById["conn-1"]).toBe("12 lines available from the tail");
    });
    expect(result.current.errors).toHaveLength(0);
  });

  it("preserves error probe feedback per connection when the adapter test fails", async () => {
    const startLogSourceConnection = vi.fn().mockResolvedValue(undefined);
    const pollStreamSession = vi.fn().mockResolvedValue(
      createPollResult({
        hasData: false,
        warnings: ["Permission denied"],
        parsedLines: ["ERROR: Permission denied"],
      }),
    );
    const stopStreamSession = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => {
      const errors: string[] = [];
      const hook = useConnectionTestController({
        t: en,
        setError: (message) => {
          if (message) {
            errors.push(message);
          }
        },
        startLogSourceConnection,
        pollStreamSession,
        stopStreamSession,
        sleepMs: vi.fn().mockResolvedValue(undefined),
      });

      return {
        ...hook,
        errors,
      };
    });

    await act(async () => {
      await result.current.handleTestConnection(
        createConnection({ kind: "gcp_cloud_run", adapterKind: "process" }),
      );
    });

    await waitFor(() => {
      expect(result.current.testStatusById["conn-1"]).toBe("error");
      expect(result.current.testMessageById["conn-1"]).toBe("Permission denied");
    });
    expect(stopStreamSession).toHaveBeenCalledWith(expect.stringMatching(/^test-conn-1-/));
    expect(result.current.errors).toHaveLength(0);
  });

  it("uses the built-in timer sleep when no custom sleep implementation is injected", async () => {
    vi.useFakeTimers();
    const startLogSourceConnection = vi.fn().mockResolvedValue(undefined);
    const pollStreamSession = vi.fn().mockResolvedValue(createPollResult());
    const stopStreamSession = vi.fn().mockResolvedValue(undefined);

    try {
      const { result } = renderHook(() => {
        const errors: string[] = [];
        const hook = useConnectionTestController({
          t: en,
          setError: (message) => {
            if (message) {
              errors.push(message);
            }
          },
          startLogSourceConnection,
          pollStreamSession,
          stopStreamSession,
        });

        return {
          ...hook,
          errors,
        };
      });

      const pending = act(async () => {
        const run = result.current.handleTestConnection(createConnection());
        await vi.advanceTimersByTimeAsync(260);
        await run;
      });

      await pending;

      expect(pollStreamSession).toHaveBeenCalledTimes(1);
      expect(stopStreamSession).toHaveBeenCalledWith(expect.stringMatching(/^test-conn-1-/));
      expect(result.current.testStatusById["conn-1"]).toBe("success");
      expect(result.current.errors).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
