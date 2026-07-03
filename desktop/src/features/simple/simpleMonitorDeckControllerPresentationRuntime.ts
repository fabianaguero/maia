import type { WaveformAnomalyMarker } from "./monitorDeckViewModel";
import {
  buildMonitorDeckPresentationHookInput,
  type BuildMonitorDeckPresentationHookInputArgs,
} from "./simpleMonitorDeckRuntime";

export interface BuildSimpleMonitorDeckControllerPresentationInputArgs extends Omit<
  BuildMonitorDeckPresentationHookInputArgs,
  "waveformAnomalies"
> {
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
