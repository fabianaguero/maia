import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderActionsInput,
  buildMonitorProviderControllerResult,
  buildMonitorProviderStateInput,
} from "../../../src/features/monitor/monitorProviderControllerHookRuntime";

describe("monitorProviderControllerHookRuntime", () => {
  it("builds controller state and actions inputs from explicit bootstrap slices", () => {
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

    expect(
      buildMonitorProviderActionsInput({
        state,
        logger,
        resolveSourceTemplate: vi.fn(),
        decodedAudioCache: bootstrap.decodedAudioCache,
        transport: {
          pollStreamSession: vi.fn(),
          pollLogStream: vi.fn(),
          ingestStreamChunk: vi.fn(),
          fetchText: bootstrap.fetchText,
        },
        sessionApi: {
          startStreamSession: vi.fn(),
          stopStreamSession: vi.fn(),
          listSessionEvents: vi.fn(),
        },
        persistence: bootstrap.persistence,
      }),
    ).toMatchObject({
      state,
      logger,
      decodedAudioCache: bootstrap.decodedAudioCache,
      transport: expect.objectContaining({
        fetchText: bootstrap.fetchText,
      }),
      persistence: bootstrap.persistence,
    });
  });

  it("returns a stable controller result envelope", () => {
    const contextInput = { marker: "context" } as never;
    const controllerActions = { sessionActions: { startSession: vi.fn() } } as never;

    expect(
      buildMonitorProviderControllerResult({
        contextInput,
        controllerActions,
      }),
    ).toEqual({
      contextInput,
      controllerActions,
    });
  });
});
