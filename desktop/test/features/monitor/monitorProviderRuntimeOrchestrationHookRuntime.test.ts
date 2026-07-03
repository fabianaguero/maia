import { describe, expect, it, vi } from "vitest";

import {
  buildMonitorProviderAudioHookInput,
  buildMonitorProviderReplayHookInput,
  buildMonitorProviderRuntimeOrchestrationResult,
} from "../../../src/features/monitor/monitorProviderRuntimeOrchestrationHookRuntime";

describe("monitorProviderRuntimeOrchestrationHookRuntime", () => {
  it("builds replay and audio hook inputs from narrowed runtime slices", () => {
    const input = { marker: "runtime-input" } as never;
    const emitUpdate = vi.fn();
    const doPoll = vi.fn(async () => undefined);
    const resetReplayTelemetry = vi.fn();

    const replayHookInput = buildMonitorProviderReplayHookInput(input, emitUpdate);
    const audioHookInput = buildMonitorProviderAudioHookInput(input, {
      resetReplayTelemetry,
      doPoll,
    });

    expect(replayHookInput).toEqual({
      input,
      emitUpdate,
    });
    expect(audioHookInput).toEqual({
      input,
      deps: {
        resetReplayTelemetry,
        doPoll,
      },
    });
  });

  it("returns a stable orchestration result envelope", () => {
    const stopPolling = vi.fn();
    const emitUpdate = vi.fn();
    const doPoll = vi.fn(async () => undefined);
    const resetReplayTelemetry = vi.fn();
    const syncReplayTelemetry = vi.fn();
    const dispatchReplayEventAtIndex = vi.fn();
    const replayTick = vi.fn();
    const ensureProviderAudioContext = vi.fn(async () => ({ state: "running" }));
    const buildLiveStartInput = vi.fn();
    const resumeAudio = vi.fn(async () => undefined);

    const result = buildMonitorProviderRuntimeOrchestrationResult({
      poll: {
        stopPolling,
        emitUpdate,
        doPoll,
      },
      replay: {
        resetReplayTelemetry,
        syncReplayTelemetry,
        dispatchReplayEventAtIndex,
        replayTick,
      },
      audio: {
        ensureProviderAudioContext,
        buildLiveStartInput,
        resumeAudio,
      },
    });

    expect(result).toMatchObject({
      stopPolling,
      emitUpdate,
      doPoll,
      resetReplayTelemetry,
      syncReplayTelemetry,
      dispatchReplayEventAtIndex,
      replayTick,
      ensureProviderAudioContext,
      buildLiveStartInput,
      resumeAudio,
    });
  });
});
