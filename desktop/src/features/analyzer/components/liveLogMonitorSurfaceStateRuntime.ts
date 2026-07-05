import type {
  BaseAssetRecord,
  BaseTrackPlaylist,
  CompositionResultRecord,
} from "../../../types/library";
import type { MonitorPrefs } from "../../../utils/monitorPrefs";
import { buildRepoResetMonitorState } from "./liveLogMonitorPreferencesRuntime";

export interface LiveLogMonitorSurfaceInitialState {
  masterVolume: number;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  basePlaylist: BaseTrackPlaylist | null;
  sceneBaseAssetId: string;
  sceneCompositionId: string;
  previousAudibleVolume: number;
}

export interface BuildLiveLogMonitorSurfaceInitialStateInput {
  availableBaseAssets: BaseAssetRecord[];
  availableCompositions: CompositionResultRecord[];
  preferredBaseAssetId?: string | null;
  preferredCompositionId?: string | null;
  prefs: MonitorPrefs | null;
}

export function buildLiveLogMonitorSurfaceInitialState(
  input: BuildLiveLogMonitorSurfaceInitialStateInput,
): LiveLogMonitorSurfaceInitialState {
  const repoResetState = buildRepoResetMonitorState({
    availableBaseAssets: input.availableBaseAssets,
    availableCompositions: input.availableCompositions,
    preferredBaseAssetIdProp: input.preferredBaseAssetId,
    preferredCompositionIdProp: input.preferredCompositionId,
    prefs: input.prefs,
  });

  return {
    masterVolume: repoResetState.masterVolume,
    selectedStyleProfileId: repoResetState.selectedStyleProfileId,
    selectedMutationProfileId: repoResetState.selectedMutationProfileId,
    basePlaylist: repoResetState.basePlaylist,
    sceneBaseAssetId: repoResetState.sceneBaseAssetId,
    sceneCompositionId: repoResetState.sceneCompositionId,
    previousAudibleVolume:
      repoResetState.masterVolume > 0 ? repoResetState.masterVolume : 0.45,
  };
}
