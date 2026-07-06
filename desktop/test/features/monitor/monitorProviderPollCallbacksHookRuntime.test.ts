import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderPollCallbacksResult,
  buildMonitorProviderPollTransportCallbacksInput,
} from "../../../src/features/monitor/monitorProviderPollCallbacksHookRuntime";

describe("monitorProviderPollCallbacksHookRuntime", () => {
  it("builds transport callbacks input from explicit lifecycle bindings", () => {
    const input = { marker: "runtime-input" } as never;
    const schedulePoll = vi.fn();

    expect(
      buildMonitorProviderPollTransportCallbacksInput(input, {
        schedulePoll,
      }),
    ).toEqual({
      input,
      deps: {
        schedulePoll,
      },
    });
  });

  it("returns a stable poll callbacks envelope", () => {
    const stopPolling = vi.fn();
    const schedulePoll = vi.fn();
    const emitUpdate = vi.fn();
    const doPoll = vi.fn(async () => undefined);

    expect(
      buildMonitorProviderPollCallbacksResult({
        lifecycle: {
          stopPolling,
          schedulePoll,
        },
        transport: {
          emitUpdate,
          doPoll,
        },
      }),
    ).toEqual({
      stopPolling,
      schedulePoll,
      emitUpdate,
      doPoll,
    });
  });
});
