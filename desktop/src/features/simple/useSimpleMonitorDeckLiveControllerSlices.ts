import { useMonitorLiveStream } from "./useMonitorLiveStream";
import { useMonitorTrackAudio } from "./useMonitorTrackAudio";
import { useSimpleMonitorReactiveAudio } from "./useSimpleMonitorReactiveAudio";
import { useSimpleMonitorDeckLiveRefs } from "./useSimpleMonitorDeckLiveRefs";
import {
  buildSimpleMonitorDeckLiveStreamHookArgs,
  buildSimpleMonitorDeckTrackAudioHookArgs,
} from "./simpleMonitorDeckLiveControllerHookRuntime";
import {
  buildSimpleMonitorLiveStreamControllerInput,
  buildSimpleMonitorReactiveAudioControllerInput,
  buildSimpleMonitorTrackAudioControllerInput,
} from "./simpleMonitorDeckLiveControllerRuntime";
import {
  buildMonitorLiveStreamHookInput,
  buildMonitorTrackAudioHookInput,
} from "./simpleMonitorDeckRuntime";
import type { UseSimpleMonitorDeckLiveControllerInput } from "./simpleMonitorDeckLiveControllerTypes";

const SAFE_MONITOR_RUNTIME = false;

export function useSimpleMonitorDeckLiveControllerSlices(
  input: UseSimpleMonitorDeckLiveControllerInput,
) {
  const refs = useSimpleMonitorDeckLiveRefs({
    activeTrack: input.activeTrack,
    deckDurationSeconds: input.deckDurationSeconds,
  });
  const reactiveAudio = useSimpleMonitorReactiveAudio(
    buildSimpleMonitorReactiveAudioControllerInput(input),
  );
  const trackAudio = useMonitorTrackAudio(
    buildMonitorTrackAudioHookInput(
      buildSimpleMonitorTrackAudioControllerInput({
        ...buildSimpleMonitorDeckTrackAudioHookArgs({
          state: input,
          reactiveAudio,
          safeRuntime: SAFE_MONITOR_RUNTIME,
        }),
      }),
    ),
  );
  const liveState = useMonitorLiveStream(
    buildMonitorLiveStreamHookInput(
      buildSimpleMonitorLiveStreamControllerInput({
        ...buildSimpleMonitorDeckLiveStreamHookArgs({
          state: input,
          reactiveAudio,
          refs,
          backgroundAudioRef: trackAudio.backgroundAudioRef,
        }),
      }),
    ),
  );

  return {
    refs,
    reactiveAudio,
    trackAudio,
    liveState,
  };
}
