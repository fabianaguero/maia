import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../../../src/features/simple/monitorSetupPreferences";
import {
  buildSimpleMonitorDeckLiveStreamHookArgs,
  buildSimpleMonitorDeckTrackAudioHookArgs,
} from "../../../src/features/simple/simpleMonitorDeckLiveControllerHookRuntime";

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
  } as never;
}

describe("simpleMonitorDeckLiveControllerHookRuntime", () => {
  it("builds track-audio and live-stream hook args from reactive-audio slices", () => {
    const state = createState();
    const reactiveAudio = {
      audioContextRef: { current: null },
      backgroundGraphRef: { current: null },
      deckControlsRef: { current: state.deckControls },
      ensureBackgroundGraph: vi.fn(),
      applyTrackMutation: vi.fn(),
      playTestTone: vi.fn(),
      playCueBatch: vi.fn(),
    };
    const backgroundAudioRef = { current: null };

    expect(
      buildSimpleMonitorDeckTrackAudioHookArgs({
        state,
        reactiveAudio,
        safeRuntime: false,
      }),
    ).toEqual({
      state,
      ensureBackgroundGraph: reactiveAudio.ensureBackgroundGraph,
      safeRuntime: false,
    });

    expect(
      buildSimpleMonitorDeckLiveStreamHookArgs({
        state,
        reactiveAudio,
        refs: {
          activeTrackRef: { current: null },
          deckDurationSecondsRef: { current: 240 },
        },
        backgroundAudioRef,
      }),
    ).toEqual(
      expect.objectContaining({
        state,
        audioContextRef: reactiveAudio.audioContextRef,
        backgroundAudioRef,
        playCueBatch: reactiveAudio.playCueBatch,
      }),
    );

    expect(reactiveAudio.applyTrackMutation).not.toHaveBeenCalled();
    expect(
      typeof buildSimpleMonitorDeckLiveStreamHookArgs({
        state,
        reactiveAudio,
        refs: {
          activeTrackRef: { current: null },
          deckDurationSecondsRef: { current: 240 },
        },
        backgroundAudioRef,
      }).applyTrackMutation,
    ).toBe("function");
  });
});
