import { describe, expect, it, vi } from "vitest";

import { buildMonitorProviderStateInput } from "../../../src/features/monitor/monitorProviderControllerHookRuntime";

describe("monitorProviderControllerHookRuntime", () => {
  it("builds controller state input from explicit bootstrap slices", () => {
    const bootstrap = {
      initialTemplate: { id: "default", label: "Default" },
      decodedAudioCache: new Map(),
      fetchText: vi.fn(async () => ""),
      persistence: {
        updatePersistedSessionCursor: vi.fn(),
        insertSessionEvent: vi.fn(),
        updatePersistedSessionStatus: vi.fn(),
      },
    };
    const state = { marker: "state" } as never;
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    expect(buildMonitorProviderStateInput(bootstrap)).toEqual({
      initialTemplate: bootstrap.initialTemplate,
    });
    expect(state).toBeDefined();
    expect(logger).toBeDefined();
  });
});
