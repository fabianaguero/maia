import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import {
  buildMonitorDeckPresentationHookInput,
  buildSimpleMonitorDeckRuntimeState,
  resolveSimpleMonitorDeckBpm,
  type BuildMonitorDeckPresentationHookInputArgs,
  type BuildSimpleMonitorDeckRuntimeStateArgs,
} from "./simpleMonitorDeckRuntime";

export type BuildSimpleMonitorDeckControllerBaseStateArgs = Omit<
  BuildSimpleMonitorDeckRuntimeStateArgs,
  "liveSuggestedBpm"
>;

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

export interface BuildSimpleMonitorDeckControllerPresentationInputArgs
  extends Omit<BuildMonitorDeckPresentationHookInputArgs, "waveformAnomalies"> {
  waveformAnomalies: WaveformAnomalyMarker[];
}

export function buildSimpleMonitorDeckControllerPresentationInput(
  input: BuildSimpleMonitorDeckControllerPresentationInputArgs,
) {
  return buildMonitorDeckPresentationHookInput({
    ...input,
    waveformAnomalies: input.waveformAnomalies,
  });
}
