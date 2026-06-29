import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { useConnectionTailController } from "../../../src/features/simple/useConnectionTailController";
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
    dominantLevel: "warn",
    lineCount: 2,
    anomalyCount: 1,
    levelCounts: {},
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: ["WARN queue depth rising"],
    warnings: [],
    ...overrides,
  };
}

describe("useConnectionTailController", () => {
  it("starts, polls and stops a live tail session", async () => {
    vi.useFakeTimers();
    const startLogSourceConnection = vi.fn().mockResolvedValue(undefined);
    const stopStreamSession = vi.fn().mockResolvedValue(undefined);
    const pollStreamSession = vi.fn().mockResolvedValue(createPollResult());

    const { result } = renderHook(() => {
      const errors: string[] = [];
      const hook = useConnectionTailController({
        t: en,
        setError: (message) => {
          if (message) {
            errors.push(message);
          }
        },
        pollStreamSession,
        startLogSourceConnection,
        stopStreamSession,
        pollIntervalMs: 100,
      });

      return {
        ...hook,
        errors,
      };
    });

    await act(async () => {
      await result.current.handleStartTail(createConnection());
    });

    expect(startLogSourceConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: "conn-1",
        startFromBeginning: false,
      }),
    );
    expect(result.current.activeConnectionId).toBe("conn-1");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(110);
    });

    expect(pollStreamSession).toHaveBeenCalled();
    expect(result.current.tailPreview).toContain("WARN queue depth rising");
    expect(result.current.tailStatus).toBe("2 lines · 1 anomalies · warn");
    expect(result.current.errors).toHaveLength(0);

    await act(async () => {
      await result.current.handleStopTail();
    });

    expect(stopStreamSession).toHaveBeenCalledWith(expect.stringMatching(/^conn-conn-1-/));
    expect(result.current.activeSessionId).toBeNull();
    expect(result.current.activeConnectionId).toBeNull();
  });

  it("surfaces start and poll failures through the shared error channel", async () => {
    vi.useFakeTimers();
    const setError = vi.fn();
    const startLogSourceConnection = vi
      .fn()
      .mockRejectedValueOnce(new Error("boot failed"))
      .mockResolvedValueOnce(undefined);
    const stopStreamSession = vi.fn().mockResolvedValue(undefined);
    const pollStreamSession = vi.fn().mockRejectedValue(new Error("poll failed"));

    const { result } = renderHook(() =>
      useConnectionTailController({
        t: en,
        setError,
        pollStreamSession,
        startLogSourceConnection,
        stopStreamSession,
        pollIntervalMs: 100,
      }),
    );

    await act(async () => {
      await result.current.handleStartTail(createConnection());
    });

    expect(setError).toHaveBeenLastCalledWith("boot failed");
    expect(result.current.activeSessionId).toBeNull();

    await act(async () => {
      await result.current.handleStartTail(createConnection({ id: "conn-2" }));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(110);
    });

    expect(setError).toHaveBeenLastCalledWith("poll failed");
    expect(result.current.activeSessionId).toBeNull();
    expect(result.current.activeConnectionId).toBeNull();
  });

  it("stops the previous session when starting a different live tail and clears timers on unmount", async () => {
    vi.useFakeTimers();
    const setError = vi.fn();
    const startLogSourceConnection = vi.fn().mockResolvedValue(undefined);
    const stopStreamSession = vi.fn().mockResolvedValue(undefined);
    const pollStreamSession = vi.fn().mockResolvedValue(createPollResult());

    const { result, unmount } = renderHook(() =>
      useConnectionTailController({
        t: en,
        setError,
        pollStreamSession,
        startLogSourceConnection,
        stopStreamSession,
        pollIntervalMs: 100,
      }),
    );

    await act(async () => {
      await result.current.handleStartTail(createConnection({ id: "conn-1" }));
    });

    const firstSessionId = result.current.activeSessionId;

    await act(async () => {
      await result.current.handleStartTail(createConnection({ id: "conn-2" }));
    });

    expect(stopStreamSession).toHaveBeenCalledWith(firstSessionId);
    expect(result.current.activeConnectionId).toBe("conn-2");
    expect(setError).toHaveBeenLastCalledWith(null);

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(pollStreamSession).not.toHaveBeenCalled();
  });
});
