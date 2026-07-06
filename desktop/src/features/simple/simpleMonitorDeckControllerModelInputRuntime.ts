import type { MonitorDeckControls } from "./monitorDeckControls";
import type { BuildSimpleMonitorDeckControllerModelArgs } from "./simpleMonitorDeckControllerRuntime";
import type { UseSimpleMonitorDeckRuntimeInput } from "./simpleMonitorDeckRuntimeTypes";
import type { BuildSimpleMonitorDeckRuntimeStateArgs } from "./simpleMonitorDeckRuntime";

export function buildSimpleMonitorDeckControllerRuntimeInput(
  input: UseSimpleMonitorDeckRuntimeInput,
): UseSimpleMonitorDeckRuntimeInput {
  return input;
}

export function buildSimpleMonitorDeckControllerModelInput(input: {
  state: UseSimpleMonitorDeckRuntimeInput;
  deckControls: MonitorDeckControls;
  activePreset: BuildSimpleMonitorDeckRuntimeStateArgs["activePreset"];
  trackDurationSeconds: number | null;
}): BuildSimpleMonitorDeckControllerModelArgs {
  return {
    state: input.state,
    deckControls: input.deckControls,
    activePreset: input.activePreset,
    trackDurationSeconds: input.trackDurationSeconds,
  };
}
