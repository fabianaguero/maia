import { useMemo } from "react";

import { buildLiveLogMonitorViewModel } from "./liveLogMonitorViewModel";
import { buildLiveLogMonitorViewModelInput } from "./liveLogMonitorPanelRuntimeStateBridge";
import type { UseLiveLogMonitorPanelRuntimeStateInput } from "./useLiveLogMonitorPanelRuntimeState";

export function useLiveLogMonitorPanelViewState(input: UseLiveLogMonitorPanelRuntimeStateInput) {
  const viewModelInput = useMemo(() => buildLiveLogMonitorViewModelInput(input), [input]);
  const viewState = useMemo(() => buildLiveLogMonitorViewModel(viewModelInput), [viewModelInput]);

  return {
    viewModelInput,
    viewState,
  };
}
