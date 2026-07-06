import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderSessionActionsHookInput,
  buildMonitorProviderSessionOrchestrationResult,
  buildMonitorProviderSessionRuntimeDependencies,
} from "../../../src/features/monitor/monitorProviderSessionOrchestrationHookRuntime";

describe("monitorProviderSessionOrchestrationHookRuntime", () => {
  it("builds the session-actions hook input from orchestration callbacks", () => {
    const buildSessionActionsInput = vi.fn((value) => value);
    const dependencies = {
      runtimeOrchestrationInput: { marker: "runtime" },
      buildSessionActionsInput,
    } as never;
    const orchestration = {
      stopPolling: vi.fn(),
      buildLiveStartInput: vi.fn(),
      ensureProviderAudioContext: vi.fn(),
      replayTick: vi.fn(),
      syncReplayTelemetry: vi.fn(),
      resetReplayTelemetry: vi.fn(),
    } as never;

    const result = buildMonitorProviderSessionActionsHookInput(dependencies, orchestration);

    expect(buildSessionActionsInput).toHaveBeenCalledWith({
      stopPolling: orchestration.stopPolling,
      buildLiveStartInput: orchestration.buildLiveStartInput,
      ensureProviderAudioContext: orchestration.ensureProviderAudioContext,
      replayTick: orchestration.replayTick,
      syncReplayTelemetry: orchestration.syncReplayTelemetry,
      resetReplayTelemetry: orchestration.resetReplayTelemetry,
    });
    expect(result).toEqual(buildSessionActionsInput.mock.results[0]?.value);
  });

  it("returns stable runtime dependencies and orchestration result envelopes", () => {
    const input = { marker: "session-runtime" } as never;
    const orchestration = { resumeAudio: vi.fn() } as never;
    const sessionActions = { startSession: vi.fn() } as never;

    expect(buildMonitorProviderSessionRuntimeDependencies(input)).toBe(input);
    expect(
      buildMonitorProviderSessionOrchestrationResult({
        orchestration,
        sessionActions,
      }),
    ).toEqual({
      orchestration,
      sessionActions,
    });
  });
});
