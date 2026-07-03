import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildConnectionsScreenFormControllerInput,
  buildConnectionsScreenTailControllerInput,
  buildConnectionsScreenTestControllerInput,
} from "../../../src/features/simple/connectionsScreenStateHookRuntime";

describe("connectionsScreenStateHookRuntime", () => {
  it("builds form controller input from screen defaults", () => {
    const input = buildConnectionsScreenFormControllerInput({
      t: en,
      defaultCloudLookback: "120m",
    });

    expect(input.t).toBe(en);
    expect(input.defaultCloudLookback).toBe("120m");
  });

  it("builds tail and test controller inputs from shared screen dependencies", () => {
    const setError = vi.fn();
    const pollStreamSession = vi.fn();
    const startLogSourceConnection = vi.fn();
    const stopStreamSession = vi.fn();

    const tailInput = buildConnectionsScreenTailControllerInput({
      t: en,
      setError,
      pollStreamSession,
      startLogSourceConnection,
      stopStreamSession,
    });
    const testInput = buildConnectionsScreenTestControllerInput({
      t: en,
      setError,
      startLogSourceConnection,
      pollStreamSession,
      stopStreamSession,
    });

    expect(tailInput.setError).toBe(setError);
    expect(tailInput.pollStreamSession).toBe(pollStreamSession);
    expect(testInput.startLogSourceConnection).toBe(startLogSourceConnection);
    expect(testInput.stopStreamSession).toBe(stopStreamSession);
  });
});
