import { describe, expect, it, vi } from "vitest";

import {
  buildConnectionTestControllerState,
  sleepForConnectionTest,
} from "../../../src/features/simple/connectionsTestControllerRuntime";

describe("connectionsTestControllerRuntime", () => {
  it("builds the public controller contract", async () => {
    const handleTestConnection = vi.fn(async () => undefined);
    expect(
      buildConnectionTestControllerState({
        testStatusById: { "conn-1": "success" },
        testMessageById: { "conn-1": "ready" },
        handleTestConnection,
      }),
    ).toEqual({
      testStatusById: { "conn-1": "success" },
      testMessageById: { "conn-1": "ready" },
      handleTestConnection,
    });
  });

  it("uses the browser timer helper for default sleeps", async () => {
    vi.useFakeTimers();

    try {
      const pending = sleepForConnectionTest(50);
      await vi.advanceTimersByTimeAsync(50);
      await expect(pending).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
