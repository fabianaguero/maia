import type { MutableRefObject } from "react";

import type { MonitorDeckControls } from "./monitorDeckControls";
import type { UseSimpleMonitorDeckRuntimeInput } from "./simpleMonitorDeckRuntimeTypes";
import type { SimpleMonitorDeckLiveControllerState } from "./simpleMonitorDeckLiveControllerRuntime";
import type { BuildSimpleMonitorDeckRuntimeStateArgs } from "./simpleMonitorDeckRuntime";

export function buildSimpleMonitorDeckControllerLiveInput(input: {
  state: UseSimpleMonitorDeckRuntimeInput;
  deckControls: MonitorDeckControls;
  activeTrack: BuildSimpleMonitorDeckRuntimeStateArgs["tracks"][number] | null;
  deckDurationSeconds: number | null;
  streamAdapterLabel: string;
  trackWaveProgressRef: MutableRefObject<number>;
  setTrackWaveProgress: (value: number) => void;
  setTrackElapsedSeconds: (value: number) => void;
  setTrackDurationSeconds: (value: number | null) => void;
}): SimpleMonitorDeckLiveControllerState {
  return {
    audioContext: input.state.audioContext,
    isListening: input.state.isListening,
    deckControls: input.deckControls,
    activeTrack: input.activeTrack,
    deckDurationSeconds: input.deckDurationSeconds,
    session: input.state.session,
    streamAdapterLabel: input.streamAdapterLabel,
    subscribe: input.state.subscribe,
    trackWaveProgressRef: input.trackWaveProgressRef,
    setTrackWaveProgress: input.setTrackWaveProgress,
    setTrackElapsedSeconds: input.setTrackElapsedSeconds,
    setTrackDurationSeconds: input.setTrackDurationSeconds,
    liveSettings: input.state.liveSettings,
  };
}
