import type { MonitorDeckControls } from "./monitorDeckControls";
import type { UseSimpleMonitorDeckRuntimeInput } from "./simpleMonitorDeckRuntimeTypes";
import {
  buildSimpleMonitorDeckRuntimeState,
  resolveSimpleMonitorDeckBpm,
  type BuildSimpleMonitorDeckRuntimeStateArgs,
} from "./simpleMonitorDeckRuntime";

export type BuildSimpleMonitorDeckControllerBaseStateArgs = Omit<
  BuildSimpleMonitorDeckRuntimeStateArgs,
  "liveSuggestedBpm"
>;

export interface BuildSimpleMonitorDeckControllerModelArgs {
  state: UseSimpleMonitorDeckRuntimeInput;
  deckControls: MonitorDeckControls;
  activePreset: BuildSimpleMonitorDeckRuntimeStateArgs["activePreset"];
  trackDurationSeconds: number | null;
}

export function buildSimpleMonitorDeckControllerBaseState(
  input: BuildSimpleMonitorDeckControllerBaseStateArgs,
) {
  return buildSimpleMonitorDeckRuntimeState({
    ...input,
    liveSuggestedBpm: null,
  });
}

export function resolveSimpleMonitorDeckControllerBpm(input: {
  liveSuggestedBpm: number | null;
  activeTrack: BuildSimpleMonitorDeckRuntimeStateArgs["tracks"][number] | null;
}): number | null {
  return resolveSimpleMonitorDeckBpm(input.liveSuggestedBpm, input.activeTrack);
}

export function buildSimpleMonitorDeckControllerModel(
  input: BuildSimpleMonitorDeckControllerModelArgs,
) {
  const baseState = buildSimpleMonitorDeckControllerBaseState({
    session: input.state.session,
    isListening: input.state.isListening,
    isLaunchingMonitor: input.state.isLaunchingMonitor,
    tracks: input.state.safeTracks,
    trackName: input.state.trackName,
    trackDurationSeconds: input.trackDurationSeconds,
    activePreset: input.activePreset,
    alertShape: input.deckControls.alertShape,
    t: input.state.t,
  });

  return {
    baseState,
    activeTrack: baseState.activeTrack,
    deckDurationSeconds: baseState.deckDurationSeconds,
    activeBeatGrid: baseState.activeBeatGrid,
    streamAdapterLabel: baseState.streamAdapterLabel,
    isMonitorActive: baseState.isMonitorActive,
    deckPresetLabel: baseState.deckPresetLabel,
    deckVisualPreset: baseState.deckVisualPreset,
  };
}
