import { useMonitorDeckControls } from "./useMonitorDeckControls";
import { useSimpleMonitorPlaybackState } from "./useSimpleMonitorPlaybackState";
import { useSimpleMonitorDeckPresentationState } from "./useSimpleMonitorDeckPresentationState";
import { useSimpleMonitorDeckLiveController } from "./useSimpleMonitorDeckLiveController";
import {
  buildSimpleMonitorDeckControllerLiveHookArgs,
  buildSimpleMonitorDeckControllerModelInput,
  buildSimpleMonitorDeckControllerPresentationHookArgs,
  buildSimpleMonitorDeckControllerRuntimeInput,
} from "./simpleMonitorDeckControllerHookRuntime";
import {
  buildSimpleMonitorDeckControllerModel,
  buildSimpleMonitorDeckControllerLiveInput,
  buildSimpleMonitorDeckControllerPresentationInput,
  resolveSimpleMonitorDeckControllerBpm,
} from "./simpleMonitorDeckControllerRuntime";
import type { UseSimpleMonitorDeckRuntimeInput } from "./simpleMonitorDeckRuntimeTypes";

const SAFE_MONITOR_RUNTIME = false;

export function useSimpleMonitorDeckControllerSlices(input: UseSimpleMonitorDeckRuntimeInput) {
  const runtimeInput = buildSimpleMonitorDeckControllerRuntimeInput(input);
  const { deckControls, activePreset } = useMonitorDeckControls({ skin: runtimeInput.skin });
  const playbackState = useSimpleMonitorPlaybackState({
    isListening: runtimeInput.isListening,
  });
  const controllerModel = buildSimpleMonitorDeckControllerModel({
    ...buildSimpleMonitorDeckControllerModelInput({
      state: runtimeInput,
      deckControls,
      activePreset,
      trackDurationSeconds: playbackState.trackDurationSeconds,
    }),
  });
  const liveState = useSimpleMonitorDeckLiveController({
    ...buildSimpleMonitorDeckControllerLiveInput({
      ...buildSimpleMonitorDeckControllerLiveHookArgs({
        state: runtimeInput,
        deckControls,
        controllerModel,
        playback: playbackState,
      }),
    }),
  });
  const deckBpm = resolveSimpleMonitorDeckControllerBpm({
    liveSuggestedBpm: liveState.liveSuggestedBpm,
    activeTrack: controllerModel.activeTrack,
  });
  const presentationState = useSimpleMonitorDeckPresentationState(
    buildSimpleMonitorDeckControllerPresentationInput({
      ...buildSimpleMonitorDeckControllerPresentationHookArgs({
        state: runtimeInput,
        deckControls,
        controllerModel,
        playback: playbackState,
        liveState: {
          backgroundAudioRef: liveState.backgroundAudioRef,
          waveformAnomalies: liveState.waveformAnomalies,
          logSignalBuffer: liveState.logSignalBuffer,
          selectedAnomalyId: liveState.selectedAnomalyId,
          setSelectedAnomalyId: liveState.setSelectedAnomalyId,
          liveLines: liveState.liveLines,
        },
        deckBpm,
        safeRuntime: SAFE_MONITOR_RUNTIME,
      }),
    }),
  );

  return {
    runtimeInput,
    deckControls,
    playbackState,
    controllerModel,
    liveState,
    deckBpm,
    presentationState,
  };
}
