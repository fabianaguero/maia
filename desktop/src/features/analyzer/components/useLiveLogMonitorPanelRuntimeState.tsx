import type {
  BaseAssetRecord,
  CompositionResultRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../types/library";
import { getLogger } from "../../../utils/logger";
import type { MonitorContextValue } from "../../monitor/MonitorContext";
import {
  buildLiveLogMonitorPanelAudioRuntimeInput,
  buildLiveLogMonitorPanelRuntimeStateValue,
  buildLiveLogMonitorReplayStateInput,
} from "./liveLogMonitorPanelRuntimeStateBridge";
import { useLiveLogMonitorPanelAudioRuntime } from "./useLiveLogMonitorPanelAudioRuntime";
import { useLiveLogMonitorReplayState } from "./useLiveLogMonitorReplayState";
import { useLiveLogMonitorPanelViewState } from "./useLiveLogMonitorPanelViewState";
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

export function useLiveLogMonitorPanelRuntimeState(input: UseLiveLogMonitorPanelRuntimeStateInput) {
  const { viewState } = useLiveLogMonitorPanelViewState(input);

  const audioRuntime = useLiveLogMonitorPanelAudioRuntime(
    buildLiveLogMonitorPanelAudioRuntimeInput(input, viewState, log),
  );

  const replayState = useLiveLogMonitorReplayState(
    buildLiveLogMonitorReplayStateInput(input, viewState),
  );

  return buildLiveLogMonitorPanelRuntimeStateValue(viewState, audioRuntime, replayState);
}
