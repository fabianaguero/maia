import { useMemo } from "react";

import type {
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../types/library";
import { getLogger } from "../../../utils/logger";
import type { MonitorContextValue } from "../../monitor/MonitorContext";
import { buildLiveLogMonitorViewModel } from "./liveLogMonitorViewModel";
import {
  buildLiveLogMonitorPanelAudioRuntimeInput,
  buildLiveLogMonitorPanelRuntimeStateValue,
  buildLiveLogMonitorReplayStateInput,
  buildLiveLogMonitorViewModelInput,
} from "./liveLogMonitorPanelRuntimeStateBridge";
import { useLiveLogMonitorPanelAudioRuntime } from "./useLiveLogMonitorPanelAudioRuntime";
import { useLiveLogMonitorReplayState } from "./useLiveLogMonitorReplayState";
import type { useLiveLogMonitorSurfaceState } from "./useLiveLogMonitorSurfaceState";

const log = getLogger("LiveMonitor");

export type LiveLogMonitorSurfaceState = ReturnType<typeof useLiveLogMonitorSurfaceState>;

export interface UseLiveLogMonitorPanelRuntimeStateInput {
  repository: RepositoryAnalysis;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  preferredBaseAssetId?: string | null;
  preferredCompositionId?: string | null;
  availableTracks: LibraryTrack[];
  monitor: MonitorContextValue;
  liveEnabled: boolean;
  replayActive: boolean;
  surfaceState: LiveLogMonitorSurfaceState;
}

export function useLiveLogMonitorPanelRuntimeState(
  input: UseLiveLogMonitorPanelRuntimeStateInput,
) {
  const viewModelInput = useMemo(() => buildLiveLogMonitorViewModelInput(input), [input]);
  const viewState = useMemo(
    () => buildLiveLogMonitorViewModel(viewModelInput),
    [viewModelInput],
  );

  const audioRuntime = useLiveLogMonitorPanelAudioRuntime(
    buildLiveLogMonitorPanelAudioRuntimeInput(input, viewState, log),
  );

  const replayState = useLiveLogMonitorReplayState(
    buildLiveLogMonitorReplayStateInput(input, viewState),
  );

  return buildLiveLogMonitorPanelRuntimeStateValue(viewState, audioRuntime, replayState);
}
