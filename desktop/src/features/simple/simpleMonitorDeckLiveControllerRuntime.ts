import type {
  BuildMonitorLiveStreamHookInputArgs,
  BuildMonitorTrackAudioHookInputArgs,
} from "./simpleMonitorDeckHookInputsRuntime";
import type { UseSimpleMonitorDeckLiveControllerInput } from "./simpleMonitorDeckLiveControllerTypes";
import type { SimpleMonitorTrackMutationUpdate } from "./simpleMonitorReactiveAudioTypes";

export type SimpleMonitorDeckLiveControllerState = UseSimpleMonitorDeckLiveControllerInput;

export function buildSimpleMonitorReactiveAudioControllerInput(
  state: SimpleMonitorDeckLiveControllerState,
) {
  return {
    audioContext: state.audioContext,
    isListening: state.isListening,
    deckControls: state.deckControls,
  };
}

export function buildSimpleMonitorTrackAudioControllerInput(input: {
  state: SimpleMonitorDeckLiveControllerState;
  ensureBackgroundGraph: BuildMonitorTrackAudioHookInputArgs["ensureBackgroundGraph"];
  safeRuntime: boolean;
}): BuildMonitorTrackAudioHookInputArgs {
  return {
    audioContext: input.state.audioContext,
    isListening: input.state.isListening,
    safeRuntime: input.safeRuntime,
    activeTrack: input.state.activeTrack,
    ensureBackgroundGraph: input.ensureBackgroundGraph,
    setTrackWaveProgress: input.state.setTrackWaveProgress,
    setTrackElapsedSeconds: input.state.setTrackElapsedSeconds,
    setTrackDurationSeconds: input.state.setTrackDurationSeconds,
  };
}

export function bindSimpleMonitorTrackMutation(input: {
  applyTrackMutation: (
    update: SimpleMonitorTrackMutationUpdate,
    backgroundAudioRef: { current: HTMLAudioElement | null },
  ) => void;
  backgroundAudioRef: { current: HTMLAudioElement | null };
}) {
  return (update: SimpleMonitorTrackMutationUpdate) =>
    input.applyTrackMutation(update, input.backgroundAudioRef);
}

export function buildSimpleMonitorLiveStreamControllerInput(input: {
  state: SimpleMonitorDeckLiveControllerState;
  audioContextRef: BuildMonitorLiveStreamHookInputArgs["audioContextRef"];
  backgroundAudioRef: BuildMonitorLiveStreamHookInputArgs["backgroundAudioRef"];
  backgroundGraphRef: BuildMonitorLiveStreamHookInputArgs["backgroundGraphRef"];
  activeTrackRef: BuildMonitorLiveStreamHookInputArgs["activeTrackRef"];
  deckDurationSecondsRef: BuildMonitorLiveStreamHookInputArgs["deckDurationSecondsRef"];
  deckControlsRef: BuildMonitorLiveStreamHookInputArgs["deckControlsRef"];
  ensureBackgroundGraph: BuildMonitorLiveStreamHookInputArgs["ensureBackgroundGraph"];
  applyTrackMutation: BuildMonitorLiveStreamHookInputArgs["applyTrackMutation"];
  playTestTone: BuildMonitorLiveStreamHookInputArgs["playTestTone"];
  playCueBatch: BuildMonitorLiveStreamHookInputArgs["playCueBatch"];
}): BuildMonitorLiveStreamHookInputArgs {
  return {
    isListening: input.state.isListening,
    sessionSourcePath: input.state.session?.sourcePath,
    streamAdapterLabel: input.state.streamAdapterLabel,
    subscribe: input.state.subscribe,
    audioContextRef: input.audioContextRef,
    backgroundAudioRef: input.backgroundAudioRef,
    backgroundGraphRef: input.backgroundGraphRef,
    activeTrackRef: input.activeTrackRef,
    deckDurationSecondsRef: input.deckDurationSecondsRef,
    trackWaveProgressRef: input.state.trackWaveProgressRef,
    deckControlsRef: input.deckControlsRef,
    trackBpm: input.state.activeTrack?.analysis?.bpm ?? null,
    ensureBackgroundGraph: input.ensureBackgroundGraph,
    applyTrackMutation: input.applyTrackMutation,
    playTestTone: input.playTestTone,
    playCueBatch: input.playCueBatch,
    liveSettings: input.state.liveSettings,
  };
}
