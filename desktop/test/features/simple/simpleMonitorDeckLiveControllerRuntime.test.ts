import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import {
  bindSimpleMonitorTrackMutation,
  buildSimpleMonitorLiveStreamControllerInput,
  buildSimpleMonitorReactiveAudioControllerInput,
  buildSimpleMonitorTrackAudioControllerInput,
} from "../../../src/features/simple/simpleMonitorDeckLiveControllerRuntime";

function createState() {
  return {
    audioContext: null,
    isListening: true,
    deckControls: {
      waveformScale: 1.4,
      beatSnapSubdivision: 0.25,
      reactivity: 55,
      anomalyEmphasis: 70,
      idleMotion: 30,
      cueCooldownMs: 850,
      masterVolume: 0.75,
      duckingIntensity: 35,
      recoveryRelease: 45,
      alertShape: "tight" as const,
    },
    activeTrack: {
      analysis: { bpm: 126 },
    },
    deckDurationSeconds: 240,
    session: {
      sourcePath: "/logs/visits-service.log",
    },
    streamAdapterLabel: "FILE_TAIL",
    subscribe: vi.fn(() => () => undefined),
    trackWaveProgressRef: { current: 0.25 },
    setTrackWaveProgress: vi.fn(),
    setTrackElapsedSeconds: vi.fn(),
    setTrackDurationSeconds: vi.fn(),
    liveSettings: DEFAULT_MONITOR_SETUP_PREFERENCES,
  };
}

describe("simpleMonitorDeckLiveControllerRuntime", () => {
  it("builds reactive audio input from live controller state", () => {
    const state = createState();

    const result = buildSimpleMonitorReactiveAudioControllerInput(state as never);

    expect(result).toEqual({
      audioContext: null,
      isListening: true,
      deckControls: state.deckControls,
    });
  });

  it("builds track audio input from controller state", () => {
    const state = createState();
    const ensureBackgroundGraph = vi.fn();

    const result = buildSimpleMonitorTrackAudioControllerInput({
      state: state as never,
      ensureBackgroundGraph,
      safeRuntime: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        audioContext: null,
        isListening: true,
        safeRuntime: false,
        activeTrack: state.activeTrack,
        ensureBackgroundGraph,
        setTrackWaveProgress: state.setTrackWaveProgress,
      }),
    );
  });

  it("binds track mutation to the current background audio ref", () => {
    const applyTrackMutation = vi.fn();
    const backgroundAudioRef = { current: null };
    const bound = bindSimpleMonitorTrackMutation({
      applyTrackMutation,
      backgroundAudioRef,
    });

    bound({ summary: "update" });

    expect(applyTrackMutation).toHaveBeenCalledWith(
      expect.objectContaining({ summary: "update" }),
      backgroundAudioRef,
    );
  });

  it("builds live stream input from controller state and refs", () => {
    const state = createState();
    const audioContextRef = { current: null };
    const backgroundAudioRef = { current: null };
    const backgroundGraphRef = { current: null };
    const activeTrackRef = { current: null };
    const deckDurationSecondsRef = { current: 240 };
    const deckControlsRef = { current: state.deckControls };
    const ensureBackgroundGraph = vi.fn();
    const applyTrackMutation = vi.fn();
    const playTestTone = vi.fn();
    const playCueBatch = vi.fn();

    const result = buildSimpleMonitorLiveStreamControllerInput({
      state: state as never,
      audioContextRef,
      backgroundAudioRef,
      backgroundGraphRef,
      activeTrackRef,
      deckDurationSecondsRef,
      deckControlsRef,
      ensureBackgroundGraph,
      applyTrackMutation,
      playTestTone,
      playCueBatch,
    });

    expect(result).toEqual(
      expect.objectContaining({
        isListening: true,
        sessionSourcePath: "/logs/visits-service.log",
        streamAdapterLabel: "FILE_TAIL",
        subscribe: state.subscribe,
        audioContextRef,
        backgroundAudioRef,
        trackWaveProgressRef: state.trackWaveProgressRef,
        deckControlsRef,
        trackBpm: 126,
        ensureBackgroundGraph,
        applyTrackMutation,
        playTestTone,
        playCueBatch,
        liveSettings: state.liveSettings,
      }),
    );
  });
});
