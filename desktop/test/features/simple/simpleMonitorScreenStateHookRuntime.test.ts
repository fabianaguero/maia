import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import {
  buildSimpleMonitorScreenControllerInput,
  buildSimpleMonitorScreenStateHookResultInput,
  buildSimpleMonitorScreenStateRuntimeInput,
} from "../../../src/features/simple/simpleMonitorScreenStateHookRuntime";

function createInput() {
  return {
    session: null,
    metrics: {
      windowCount: 2,
      processedLines: 10,
      totalAnomalies: 2,
    },
    pastSessions: [],
    repositories: [],
    tracks: [],
    onStop: vi.fn(),
    onResumeAudio: vi.fn(),
    audioStatus: "running" as const,
    audioContext: null,
    onStartMonitoring: vi.fn(),
    onReplaySession: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
    trackName: "Deck Track",
    waveformBins: [0.1, 0.2],
    onToggleConsole: vi.fn(),
    liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
  } as const;
}

describe("simpleMonitorScreenStateHookRuntime", () => {
  it("normalizes default screen-state values", () => {
    const input = createInput();
    expect(buildSimpleMonitorScreenStateRuntimeInput(input)).toEqual(
      expect.objectContaining({
        skin: "nightfall",
        isConsoleExpanded: false,
      }),
    );
  });

  it("passes controller input and hook-state args through unchanged", () => {
    const runtimeInput = buildSimpleMonitorScreenStateRuntimeInput(createInput());
    const hookStateArgs = { isMonitorActive: false, sessions: [] } as never;

    expect(buildSimpleMonitorScreenControllerInput(runtimeInput)).toBe(runtimeInput);
    expect(buildSimpleMonitorScreenStateHookResultInput(hookStateArgs)).toBe(hookStateArgs);
  });
});
