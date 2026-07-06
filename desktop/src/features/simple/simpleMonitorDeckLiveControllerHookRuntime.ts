import type { UseSimpleMonitorDeckLiveControllerInput } from "./simpleMonitorDeckLiveControllerTypes";
import type { SimpleMonitorReactiveAudioHookState } from "./simpleMonitorReactiveAudioTypes";
import { bindSimpleMonitorTrackMutation } from "./simpleMonitorDeckLiveControllerRuntime";
import type { UseSimpleMonitorDeckLiveRefsState } from "./useSimpleMonitorDeckLiveRefs";

export function buildSimpleMonitorDeckTrackAudioHookArgs(input: {
  state: UseSimpleMonitorDeckLiveControllerInput;
  reactiveAudio: SimpleMonitorReactiveAudioHookState;
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
  reactiveAudio: SimpleMonitorReactiveAudioHookState;
  refs: UseSimpleMonitorDeckLiveRefsState;
  backgroundAudioRef: { current: HTMLAudioElement | null };
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
    applyTrackMutation: bindSimpleMonitorTrackMutation({
      applyTrackMutation: input.reactiveAudio.applyTrackMutation,
      backgroundAudioRef: input.backgroundAudioRef,
    }),
    playTestTone: input.reactiveAudio.playTestTone,
    playCueBatch: input.reactiveAudio.playCueBatch,
  };
}
