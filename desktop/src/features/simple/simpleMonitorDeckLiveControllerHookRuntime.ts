import type { BuildMonitorLiveStreamHookInputArgs } from "./simpleMonitorDeckHookInputsRuntime";
import type {
  SimpleMonitorDeckLiveControllerResult,
  UseSimpleMonitorDeckLiveControllerInput,
} from "./simpleMonitorDeckLiveControllerTypes";
import type { MonitorLiveStreamHookState } from "./monitorLiveStreamStateTypes";
import type { SimpleMonitorReactiveAudioHookState } from "./simpleMonitorReactiveAudioTypes";

export function buildSimpleMonitorDeckReactiveAudioHookArgs(
  input: UseSimpleMonitorDeckLiveControllerInput,
): UseSimpleMonitorDeckLiveControllerInput {
  return input;
}

export function buildSimpleMonitorDeckTrackAudioHookArgs(input: {
  state: UseSimpleMonitorDeckLiveControllerInput;
  reactiveAudio: Pick<SimpleMonitorReactiveAudioHookState, "ensureBackgroundGraph">;
  safeRuntime: boolean;
}) {
  return {
    state: input.state,
    ensureBackgroundGraph: input.reactiveAudio.ensureBackgroundGraph,
    safeRuntime: input.safeRuntime,
  };
}

export function buildSimpleMonitorDeckLiveStreamHookArgs(input: {
  state: UseSimpleMonitorDeckLiveControllerInput;
  reactiveAudio: Pick<
    SimpleMonitorReactiveAudioHookState,
    | "audioContextRef"
    | "backgroundGraphRef"
    | "deckControlsRef"
    | "ensureBackgroundGraph"
    | "applyTrackMutation"
    | "playTestTone"
    | "playCueBatch"
  >;
  refs: {
    activeTrackRef: BuildMonitorLiveStreamHookInputArgs["activeTrackRef"];
    deckDurationSecondsRef: BuildMonitorLiveStreamHookInputArgs["deckDurationSecondsRef"];
  };
  backgroundAudioRef: { current: HTMLAudioElement | null };
  applyTrackMutation: BuildMonitorLiveStreamHookInputArgs["applyTrackMutation"];
}) {
  return {
    state: input.state,
    audioContextRef: input.reactiveAudio.audioContextRef,
    backgroundAudioRef: input.backgroundAudioRef,
    backgroundGraphRef: input.reactiveAudio.backgroundGraphRef,
    activeTrackRef: input.refs.activeTrackRef,
    deckDurationSecondsRef: input.refs.deckDurationSecondsRef,
    deckControlsRef: input.reactiveAudio.deckControlsRef,
    ensureBackgroundGraph: input.reactiveAudio.ensureBackgroundGraph,
    applyTrackMutation: input.applyTrackMutation,
    playTestTone: input.reactiveAudio.playTestTone,
    playCueBatch: input.reactiveAudio.playCueBatch,
  };
}

export function buildSimpleMonitorDeckLiveControllerHookResult(input: {
  trackAudio: Pick<
    SimpleMonitorDeckLiveControllerResult,
    "backgroundAudioRef" | "previewTrackId" | "toggleTrackPreview"
  >;
  liveState: MonitorLiveStreamHookState;
}) {
  return {
    backgroundAudioRef: input.trackAudio.backgroundAudioRef,
    previewTrackId: input.trackAudio.previewTrackId,
    toggleTrackPreview: input.trackAudio.toggleTrackPreview,
    ...input.liveState,
  };
}
