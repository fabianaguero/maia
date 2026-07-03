import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import {
  buildMonitorLiveStreamIdleMotionControllerInput,
  buildMonitorLiveStreamLifecycleControllerInput,
  buildMonitorLiveStreamSubscriptionControllerInput,
  simulateMonitorLiveStreamLogState,
} from "../../../src/features/simple/monitorLiveStreamControllerRuntime";
import { createMonitorSignalBuffer } from "../../../src/features/simple/monitorLiveStreamRuntime";

function createState() {
  return {
    isListening: true,
    sessionSourcePath: "/logs/visits-service.log",
    streamAdapterLabel: "PROCESS_TAIL",
    subscribe: vi.fn(() => () => undefined),
    audioContextRef: { current: null as AudioContext | null },
    backgroundAudioRef: { current: null as HTMLAudioElement | null },
    backgroundGraphRef: { current: null as unknown },
    activeTrackRef: { current: null },
    deckDurationSecondsRef: { current: 240 as number | null },
    trackWaveProgressRef: { current: 0.25 },
    deckControlsRef: { current: DEFAULT_MONITOR_DECK_CONTROLS },
    trackBpm: 126,
    ensureBackgroundGraph: vi.fn(),
    applyTrackMutation: vi.fn(),
    playTestTone: vi.fn(),
    playCueBatch: vi.fn(),
    idleHoldMs: 900,
    maxLiveLines: 8,
    liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
  };
}

function createRefs() {
  return {
    liveSuggestedBpmRef: { current: 126 as number | null },
    liveLinesRef: { current: [] },
    logSignalBufferRef: { current: createMonitorSignalBuffer() },
    waveformAnomaliesRef: { current: [] },
    selectedAnomalyIdRef: { current: null as string | null },
    audioProbePlayedRef: { current: false },
    lastCueAccentAtRef: { current: 0 },
    lastStreamEventAtRef: { current: 1000 },
  };
}

function createSetters() {
  return {
    setLiveLines: vi.fn(),
    setLogSignalBuffer: vi.fn(),
    setLiveSuggestedBpm: vi.fn(),
    setWaveformAnomalies: vi.fn(),
    setSelectedAnomalyId: vi.fn(),
  };
}

describe("monitorLiveStreamControllerRuntime", () => {
  it("builds lifecycle input from controller state", () => {
    const state = createState();
    const refs = createRefs();
    const setters = createSetters();

    const result = buildMonitorLiveStreamLifecycleControllerInput({
      state,
      refs,
      setters,
    });

    expect(result).toEqual(
      expect.objectContaining({
        isListening: true,
        sessionSourcePath: "/logs/visits-service.log",
        streamAdapterLabel: "PROCESS_TAIL",
        liveLinesRef: refs.liveLinesRef,
        setLiveLines: setters.setLiveLines,
      }),
    );
  });

  it("builds subscription and idle inputs from grouped state", () => {
    const state = createState();
    const refs = createRefs();
    const setters = createSetters();

    const subscription = buildMonitorLiveStreamSubscriptionControllerInput({
      state,
      refs,
      setters,
    });
    const idle = buildMonitorLiveStreamIdleMotionControllerInput({
      state,
      refs,
      setters,
    });

    expect(subscription).toEqual(
      expect.objectContaining({
        isListening: true,
        subscribe: state.subscribe,
        maxLiveLines: 8,
        liveSuggestedBpmRef: refs.liveSuggestedBpmRef,
        playCueBatch: state.playCueBatch,
      }),
    );
    expect(idle).toEqual(
      expect.objectContaining({
        isListening: true,
        idleHoldMs: 900,
        trackBpm: 126,
        deckControlsRef: state.deckControlsRef,
        setLogSignalBuffer: setters.setLogSignalBuffer,
      }),
    );
  });

  it("simulates monitor log state and updates refs plus setters", () => {
    const refs = {
      liveLinesRef: { current: [] as Array<{ id: string }> },
      logSignalBufferRef: { current: createMonitorSignalBuffer() },
    };
    const setLiveLines = vi.fn();
    const setLogSignalBuffer = vi.fn();

    const nextState = simulateMonitorLiveStreamLogState({
      nowMs: 2000,
      previousLiveLines: refs.liveLinesRef.current,
      previousLogSignalBuffer: refs.logSignalBufferRef.current,
      setLiveLines,
      setLogSignalBuffer,
      refs,
      randomValue: 0.7,
      maxLiveLines: 8,
    });

    expect(nextState.mock.id).toContain("sim-");
    expect(refs.liveLinesRef.current[0]?.id).toBe(nextState.mock.id);
    expect(setLiveLines).toHaveBeenCalledWith(nextState.nextLiveLines);
    expect(setLogSignalBuffer).toHaveBeenCalledWith(nextState.nextLogSignalBuffer);
  });
});
