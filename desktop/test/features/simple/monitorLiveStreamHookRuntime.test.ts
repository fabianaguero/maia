import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { buildMonitorLiveStreamControllerState } from "../../../src/features/simple/monitorLiveStreamHookRuntime";

describe("monitorLiveStreamHookRuntime", () => {
  it("builds the monitor live stream controller state from hook options", () => {
    const subscribe = vi.fn(() => () => undefined);
    const ensureBackgroundGraph = vi.fn();
    const applyTrackMutation = vi.fn();
    const playTestTone = vi.fn();
    const playCueBatch = vi.fn();

    const state = buildMonitorLiveStreamControllerState({
      isListening: true,
      sessionSourcePath: "/logs/app.log",
      streamAdapterLabel: "FILE_TAIL",
      subscribe,
      audioContextRef: { current: null },
      backgroundAudioRef: { current: null },
      backgroundGraphRef: { current: null },
      activeTrackRef: { current: null },
      deckDurationSecondsRef: { current: 240 },
      trackWaveProgressRef: { current: 0.5 },
      deckControlsRef: { current: DEFAULT_MONITOR_DECK_CONTROLS },
      trackBpm: 126,
      ensureBackgroundGraph,
      applyTrackMutation,
      playTestTone,
      playCueBatch,
      idleHoldMs: 500,
      maxLiveLines: 32,
    });

    expect(state).toMatchObject({
      isListening: true,
      sessionSourcePath: "/logs/app.log",
      streamAdapterLabel: "FILE_TAIL",
      trackBpm: 126,
      idleHoldMs: 500,
      maxLiveLines: 32,
      subscribe,
      ensureBackgroundGraph,
      applyTrackMutation,
      playTestTone,
      playCueBatch,
    });
  });
});
