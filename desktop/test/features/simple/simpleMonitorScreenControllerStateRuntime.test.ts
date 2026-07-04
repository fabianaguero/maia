import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import {
  buildSimpleMonitorScreenControllerCollections,
  buildSimpleMonitorScreenControllerSlicesInput,
  buildSimpleMonitorScreenControllerState,
} from "../../../src/features/simple/simpleMonitorScreenControllerStateRuntime";
import { en } from "../../../src/i18n/en";

function createStateInput() {
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
    isConsoleExpanded: undefined,
    onToggleConsole: vi.fn(),
    liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
  } as never;
}

describe("simpleMonitorScreenControllerStateRuntime", () => {
  it("builds a stable controller state with normalized console expansion", () => {
    const state = buildSimpleMonitorScreenControllerState(createStateInput());

    expect(state.skin).toBe("copper");
    expect(state.trackName).toBe("Deck Track");
    expect(state.isConsoleExpanded).toBe(false);
    expect(state.liveSettings).toBe(DEFAULT_MONITOR_SETUP_PREFERENCES);
  });

  it("builds collections and slices input for the controller hook", () => {
    const state = buildSimpleMonitorScreenControllerState(createStateInput());
    const collections = buildSimpleMonitorScreenControllerCollections({
      pastSessions: state.pastSessions,
      repositories: state.repositories,
      tracks: state.tracks,
    });

    expect(collections.safePastSessions).toEqual(state.pastSessions);
    expect(collections.safeRepositories).toEqual(state.repositories);
    expect(collections.safeTracks).toEqual(state.tracks);

    expect(
      buildSimpleMonitorScreenControllerSlicesInput({
        state,
        collections,
        isListening: false,
        t: en,
      }),
    ).toEqual({
      state,
      collections,
      isListening: false,
      t: en,
    });
  });
});
