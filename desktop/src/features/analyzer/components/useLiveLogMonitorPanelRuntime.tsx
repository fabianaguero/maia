import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
  LibraryTrack,
  RepositoryAnalysis,
} from "../../../types/library";
import type { AppTranslations } from "../../../i18n/en";
import type { MonitorContextValue } from "../../monitor/MonitorContext";
import { useLiveLogMonitorLifecycle } from "./useLiveLogMonitorLifecycle";
import { useLiveLogMonitorOrchestrator } from "./useLiveLogMonitorOrchestrator";
import { useLiveLogMonitorPanelDeckRuntime } from "./useLiveLogMonitorPanelDeckRuntime";
import {
  buildLiveLogMonitorDeckRuntimeInput,
  buildLiveLogMonitorLifecycleInput,
  buildLiveLogMonitorOrchestratorInput,
} from "./liveLogMonitorPanelRuntimeBridge";
import {
  useLiveLogMonitorPanelRuntimeState,
  type LiveLogMonitorSurfaceState,
} from "./useLiveLogMonitorPanelRuntimeState";

export interface UseLiveLogMonitorPanelRuntimeInput {
  repository: RepositoryAnalysis;
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  preferredBaseAssetId?: string | null;
  preferredCompositionId?: string | null;
  availableTracks: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
  monitor: MonitorContextValue;
  t: AppTranslations;
  liveEnabled: boolean;
  replayActive: boolean;
  playbackPercent: number | null;
  playbackWindowLabel: string | null;
  surfaceState: LiveLogMonitorSurfaceState;
}

export function useLiveLogMonitorPanelRuntime(input: UseLiveLogMonitorPanelRuntimeInput) {
  const runtimeState = useLiveLogMonitorPanelRuntimeState(input);

  const { onStreamUpdate } = useLiveLogMonitorOrchestrator(
    buildLiveLogMonitorOrchestratorInput(input, runtimeState),
  );

  useLiveLogMonitorLifecycle(buildLiveLogMonitorLifecycleInput(input, runtimeState, onStreamUpdate));

  return useLiveLogMonitorPanelDeckRuntime(buildLiveLogMonitorDeckRuntimeInput(input, runtimeState));
}
