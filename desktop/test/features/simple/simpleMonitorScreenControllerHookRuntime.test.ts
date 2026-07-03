import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import {
  buildSimpleMonitorScreenControllerAnomalyFilterArgs,
  buildSimpleMonitorScreenControllerCollectionsInput,
  buildSimpleMonitorScreenControllerDeckHookArgs,
  buildSimpleMonitorScreenControllerHookResult,
  buildSimpleMonitorScreenControllerLaunchHookArgs,
  buildSimpleMonitorScreenControllerRuntimeInput,
} from "../../../src/features/simple/simpleMonitorScreenControllerHookRuntime";
import { en } from "../../../src/i18n/en";

function createInput() {
  return {
    skin: "copper",
    session: null,
    metrics: {
      windowCount: 2,
      processedLines: 12,
      totalAnomalies: 3,
    },
    pastSessions: [{ id: "session-1" }],
    repositories: [{ id: "repo-1" }],
    tracks: [{ id: "track-1" }],
    onStop: vi.fn(),
    onResumeAudio: vi.fn(),
    audioStatus: "running" as const,
    audioContext: null,
    onStartMonitoring: vi.fn(),
    onReplaySession: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
    trackName: "Deck Track",
    waveformBins: [0.1, 0.2],
    isConsoleExpanded: false,
    onToggleConsole: vi.fn(),
    liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
  } as never;
}

describe("simpleMonitorScreenControllerHookRuntime", () => {
  it("passes the controller runtime input through unchanged", () => {
    const input = createInput();
    expect(buildSimpleMonitorScreenControllerRuntimeInput(input)).toBe(input);
  });

  it("builds collection, launch, deck, and anomaly-filter args from controller state", () => {
    const input = createInput();
    const collections = {
      safeRepositories: input.repositories,
      safeTracks: input.tracks,
    } as never;

    expect(buildSimpleMonitorScreenControllerCollectionsInput(input)).toEqual({
      pastSessions: input.pastSessions,
      repositories: input.repositories,
      tracks: input.tracks,
    });

    expect(
      buildSimpleMonitorScreenControllerLaunchHookArgs({
        collections,
        isListening: false,
        t: en,
        onResumeAudio: input.onResumeAudio,
        onStartMonitoring: input.onStartMonitoring,
      }),
    ).toEqual({
      repositories: input.repositories,
      isListening: false,
      t: en,
      onResumeAudio: input.onResumeAudio,
      onStartMonitoring: input.onStartMonitoring,
    });

    expect(
      buildSimpleMonitorScreenControllerDeckHookArgs({
        state: input,
        isListening: false,
        isLaunchingMonitor: true,
        collections,
        t: en,
      }),
    ).toEqual(
      expect.objectContaining({
        skin: "copper",
        safeTracks: input.tracks,
        isLaunchingMonitor: true,
        t: en,
      }),
    );

    expect(buildSimpleMonitorScreenControllerAnomalyFilterArgs(input)).toEqual({
      isConsoleExpanded: false,
      onToggleConsole: input.onToggleConsole,
    });
  });

  it("wraps hookStateArgs in the public controller result", () => {
    expect(buildSimpleMonitorScreenControllerHookResult({ ready: true })).toEqual({
      hookStateArgs: { ready: true },
    });
  });
});
