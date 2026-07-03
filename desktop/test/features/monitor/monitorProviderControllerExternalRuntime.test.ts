import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderFetchText,
  buildMonitorProviderPersistenceAdapters,
} from "../../../src/features/monitor/monitorProviderControllerExternalRuntime";

describe("monitorProviderControllerExternalRuntime", () => {
  it("builds a fetchText adapter from the platform fetch function", async () => {
    const response = {
      text: vi.fn(async () => "stream-body"),
    };
    const fetchFn = vi.fn(async () => response as Response);

    const fetchText = buildMonitorProviderFetchText(fetchFn as typeof fetch);

    await expect(fetchText("https://logs.example")).resolves.toBe("stream-body");
    expect(fetchFn).toHaveBeenCalledWith("https://logs.example");
    expect(response.text).toHaveBeenCalled();
  });

  it("builds persistence adapters while preserving the existing contract", async () => {
    const updatePersistedSessionCursor = vi.fn(async () => undefined);
    const insertSessionEvent = vi.fn(async () => undefined);
    const updatePersistedSessionStatus = vi.fn(async () => undefined);

    const adapters = buildMonitorProviderPersistenceAdapters({
      insertSessionEvent,
      updatePersistedSessionCursor,
      updatePersistedSessionStatus,
    });

    expect(adapters.updatePersistedSessionCursor).toBe(updatePersistedSessionCursor);
    expect(adapters.updatePersistedSessionStatus).toBe(updatePersistedSessionStatus);

    await adapters.insertSessionEvent({
      sessionId: "persisted-1",
      pollIndex: 1,
      fromOffset: 0,
      toOffset: 100,
      summary: "window-1",
      suggestedBpm: 126,
      confidence: 0.8,
      dominantLevel: "info",
      lineCount: 4,
      anomalyCount: 0,
      levelCountsJson: "{}",
      anomalyMarkersJson: "[]",
      topComponentsJson: "[]",
      sonificationCuesJson: "[]",
      parsedLinesJson: "[]",
      warningsJson: "[]",
    });

    expect(insertSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "persisted-1",
        summary: "window-1",
      }),
    );
  });
});
