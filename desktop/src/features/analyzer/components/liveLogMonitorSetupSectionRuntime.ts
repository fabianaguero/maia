import { buildLiveLogMonitorBasePlaylistPanelProps } from "./liveLogMonitorSetupBasePlaylistRuntime";
import {
  buildLiveLogMonitorLaunchPanelProps,
  resolveForcedLiveMutationStateDetail,
} from "./liveLogMonitorSetupLaunchRuntime";
import type {
  BasePlaylistEditorItem,
  BasePlaylistTrackOption,
  LiveLogMonitorSetupDeckViewModel,
  LiveLogMonitorSetupSectionInput,
  ProfileOption,
  SavedPlaylistOption,
} from "./liveLogMonitorSetupSectionTypes";
import { buildLiveLogMonitorSetupWorkflowStripProps } from "./liveLogMonitorSetupWorkflowRuntime";

export type {
  BasePlaylistEditorItem,
  BasePlaylistTrackOption,
  LiveLogMonitorSetupDeckViewModel,
  LiveLogMonitorSetupSectionInput,
  ProfileOption,
  SavedPlaylistOption,
};
export { resolveForcedLiveMutationStateDetail };

export function buildLiveLogMonitorSetupDeckViewModel(
  input: LiveLogMonitorSetupSectionInput,
): LiveLogMonitorSetupDeckViewModel {
  return {
    workflowStripProps: buildLiveLogMonitorSetupWorkflowStripProps(input),
    basePlaylistPanelProps: buildLiveLogMonitorBasePlaylistPanelProps(input),
    launchPanelProps: buildLiveLogMonitorLaunchPanelProps(input),
  };
}
