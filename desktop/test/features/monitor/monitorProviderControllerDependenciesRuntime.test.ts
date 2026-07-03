import { describe, expect, it, vi } from "vitest";

import { buildMonitorProviderControllerBootstrap } from "../../../src/features/monitor/monitorProviderControllerDependenciesRuntime";

describe("monitorProviderControllerDependenciesRuntime", () => {
  it("builds initial template, decode cache, fetch bridge, and persistence adapters", async () => {
    const resolveSourceTemplate = vi.fn((id: string) => ({
      id,
      label: "Default template",
    }));
    const createGuideTrackDecodeCache = vi.fn(() => ({ cache: "decoded-audio" }));
    const fetchFn = vi.fn(async () => ({
      text: async () => "stream-text",
    })) as typeof fetch;
    const insertSessionEvent = vi.fn(async (payload: unknown) => payload);
    const updatePersistedSessionCursor = vi.fn();
    const updatePersistedSessionStatus = vi.fn();

    const result = buildMonitorProviderControllerBootstrap({
      defaultSourceTemplateId: "default-template",
      resolveSourceTemplate,
      createGuideTrackDecodeCache,
      fetchFn,
      insertSessionEvent,
      updatePersistedSessionCursor,
      updatePersistedSessionStatus,
    });

    expect(resolveSourceTemplate).toHaveBeenCalledWith("default-template");
    expect(createGuideTrackDecodeCache).toHaveBeenCalledTimes(1);
    expect(result.initialTemplate).toEqual({
      id: "default-template",
      label: "Default template",
    });
    expect(result.decodedAudioCache).toEqual({ cache: "decoded-audio" });
    expect(await result.fetchText("https://logs.example")).toBe("stream-text");
    expect(fetchFn).toHaveBeenCalledWith("https://logs.example");

    await result.persistence.insertSessionEvent({ sessionId: "persisted-1" });
    expect(insertSessionEvent).toHaveBeenCalledWith({ sessionId: "persisted-1" });
    expect(result.persistence.updatePersistedSessionCursor).toBe(updatePersistedSessionCursor);
    expect(result.persistence.updatePersistedSessionStatus).toBe(updatePersistedSessionStatus);
  });
});
