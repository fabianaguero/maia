import type { MonitorDeckControls } from "./monitorDeckControls";
import type { UseSimpleMonitorDeckRuntimeInput } from "./simpleMonitorDeckRuntimeTypes";
import type { SimpleMonitorDeckRuntimeState } from "./simpleMonitorDeckRuntime";
import type { SimpleMonitorDeckPlaybackStateSlice } from "./simpleMonitorDeckControllerHookTypes";

export function buildSimpleMonitorDeckControllerLiveHookArgs(input: {
  state: UseSimpleMonitorDeckRuntimeInput;
  deckControls: MonitorDeckControls;
  controllerModel: Pick<
    SimpleMonitorDeckRuntimeState,
    "activeTrack" | "deckDurationSeconds" | "streamAdapterLabel"
  >;
  playback: SimpleMonitorDeckPlaybackStateSlice;
}) {
  return {
    state: input.state,
    deckControls: input.deckControls,
    activeTrack: input.controllerModel.activeTrack,
    deckDurationSeconds: input.controllerModel.deckDurationSeconds,
    streamAdapterLabel: input.controllerModel.streamAdapterLabel,
    trackWaveProgressRef: input.playback.trackWaveProgressRef,
    setTrackWaveProgress: input.playback.setTrackWaveProgress,
    setTrackElapsedSeconds: input.playback.setTrackElapsedSeconds,
    setTrackDurationSeconds: input.playback.setTrackDurationSeconds,
  };
}
