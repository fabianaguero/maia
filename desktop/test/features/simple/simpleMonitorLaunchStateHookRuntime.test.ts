import { describe, expect, it, vi } from "vitest";

import {
  buildSimpleMonitorLaunchSelectorInput,
  buildSimpleMonitorLaunchStateResult,
  buildSimpleMonitorStartRequestInput,
} from "../../../src/features/simple/simpleMonitorLaunchStateHookRuntime";

describe("simpleMonitorLaunchStateHookRuntime", () => {
  it("builds selector and start-request inputs from narrowed launch state slices", () => {
    const input = {
      repositories: [],
      isListening: false,
      t: {} as never,
      onResumeAudio: vi.fn(),
      onStartMonitoring: vi.fn(),
    };
    const setLaunchingImmediate = vi.fn();
    const waitForNextFrame = vi.fn(async () => undefined);
    const resetLaunchingOnFailure = vi.fn();

    const selectorInput = buildSimpleMonitorLaunchSelectorInput(
      input as never,
      "track-1",
      {} as never,
    );
    const startRequestInput = buildSimpleMonitorStartRequestInput({
      selector: {
        selectedSourceOption: { id: "repo-1" } as never,
        canStartSelectedSource: true,
      },
      selectedSoundId: "track-1",
      onResumeAudio: input.onResumeAudio,
      onStartMonitoring: input.onStartMonitoring,
      setLaunchingImmediate,
      waitForNextFrame,
      resetLaunchingOnFailure,
    });

    expect(selectorInput.selectedSoundId).toBe("track-1");
    expect(startRequestInput.selectedSoundId).toBe("track-1");
    expect(startRequestInput.resumeAudio).toBe(input.onResumeAudio);
    expect(startRequestInput.startMonitoring).toBe(input.onStartMonitoring);
  });

  it("returns a stable launch-state result envelope", () => {
    const result = buildSimpleMonitorLaunchStateResult({
      selectedSoundId: "track-1",
      setSelectedSoundId: vi.fn(),
      filteredMonitorSourceOptions: [],
      selectedSourceOption: null,
      canStartSelectedSource: false,
      sourceEmptyMessage: "empty",
      startHint: "hint",
      selectedSourceId: "",
      setSelectedSourceId: vi.fn(),
      sourceFilter: "all",
      setSourceFilter: vi.fn(),
      isLaunchingMonitor: false,
      setIsLaunchingMonitor: vi.fn(),
      handleStartMonitoringRequest: vi.fn(async () => undefined),
    });

    expect(result.selectedSoundId).toBe("track-1");
    expect(result.sourceFilter).toBe("all");
  });
});
