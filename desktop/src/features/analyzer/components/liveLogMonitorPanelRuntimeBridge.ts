import type { UseLiveLogMonitorPanelRuntimeInput } from "./useLiveLogMonitorPanelRuntime";
import type { useLiveLogMonitorPanelRuntimeState } from "./useLiveLogMonitorPanelRuntimeState";
import type { LiveLogStreamUpdate } from "../../../types/library";
import {
  buildLiveLogMonitorDeckRuntimeInputSlices,
  buildLiveLogMonitorLifecycleInputSlices,
  buildLiveLogMonitorOrchestratorInputSlices,
} from "./liveLogMonitorPanelRuntimeBridgeRuntime";

type LiveLogMonitorPanelRuntimeState = ReturnType<typeof useLiveLogMonitorPanelRuntimeState>;

export function buildLiveLogMonitorOrchestratorInput(
  input: UseLiveLogMonitorPanelRuntimeInput,
  runtimeState: LiveLogMonitorPanelRuntimeState,
) {
  const slices = buildLiveLogMonitorOrchestratorInputSlices({
    panelInput: input,
    runtimeState,
  });
  return {
    ...slices.monitorSlice,
    ...slices.surfaceSlice,
    ...slices.runtimeSlice,
    logger: {
      info: () => undefined,
      debug: () => undefined,
      trace: () => undefined,
    },
  };
}

export function buildLiveLogMonitorLifecycleInput(
  input: UseLiveLogMonitorPanelRuntimeInput,
  runtimeState: LiveLogMonitorPanelRuntimeState,
  onStreamUpdate: (update: LiveLogStreamUpdate) => void,
) {
  const slices = buildLiveLogMonitorLifecycleInputSlices({
    panelInput: input,
    runtimeState,
    onStreamUpdate,
  });
  return {
    ...slices.selectionSlice,
    ...slices.monitorSlice,
    ...slices.runtimeSlice,
  };
}

export function buildLiveLogMonitorDeckRuntimeInput(
  input: UseLiveLogMonitorPanelRuntimeInput,
  runtimeState: LiveLogMonitorPanelRuntimeState,
) {
  const slices = buildLiveLogMonitorDeckRuntimeInputSlices({
    panelInput: input,
    runtimeState,
  });
  return {
    ...slices.viewSlice,
    ...slices.runtimeSlice,
    ...slices.replaySlice,
    ...slices.actionSlice,
  };
}
