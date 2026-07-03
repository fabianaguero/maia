import type { ComponentProps, Dispatch, SetStateAction } from "react";

import type { AppTranslations } from "../../../i18n/en";
import type { BaseTrackPlaylist, LibraryTrack, StreamAdapterKind } from "../../../types/library";
import { LiveLogMonitorBasePlaylistPanel } from "./LiveLogMonitorBasePlaylistPanel";
import { LiveLogMonitorLaunchPanel } from "./LiveLogMonitorLaunchPanel";
import { LiveLogMonitorWorkflowStrip } from "./LiveLogMonitorWorkflowStrip";
import type { ForcedLiveMutationState } from "./liveLogMonitorViewModel";

export interface BasePlaylistTrackOption {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface SavedPlaylistOption {
  id: string;
  label: string;
}

export interface BasePlaylistEditorItem {
  id: string;
  label: string;
  lostTitle: string | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export interface ProfileOption {
  id: string;
  label: string;
  description: string;
}

export interface LiveLogMonitorSetupSectionInput {
  t: AppTranslations;
  adapterKind: StreamAdapterKind;
  adapterDescription: string;
  adapterTarget: string;
  selectedStyleProfileId: string;
  selectedMutationProfileId: string;
  selectedStyleProfile: ProfileOption;
  selectedMutationProfile: ProfileOption;
  forcedLiveMutationState: ForcedLiveMutationState;
  hasBaseListeningBed: boolean;
  baseTrackCount: number;
  adapterConfigured: boolean;
  cueEnginePreviewLabel: string;
  liveMutationStateLabel: string;
  error: string | null;
  isStarting: boolean;
  pendingAddTrackId: string;
  pendingLoadPlaylistId: string;
  basePlaylist: BaseTrackPlaylist | null;
  basePlaylistTrackOptions: BasePlaylistTrackOption[];
  savedPlaylistOptions: SavedPlaylistOption[];
  basePlaylistEditorItems: BasePlaylistEditorItem[];
  availablePlaylists: BaseTrackPlaylist[];
  availableTracks: LibraryTrack[];
  setBasePlaylist: Dispatch<SetStateAction<BaseTrackPlaylist | null>>;
  setPendingAddTrackId: (value: string) => void;
  setPendingLoadPlaylistId: (value: string) => void;
  setAdapterKind: (value: StreamAdapterKind) => void;
  setSelectedStyleProfileId: (value: string) => void;
  setSelectedMutationProfileId: (value: string) => void;
  setForcedLiveMutationState: (value: ForcedLiveMutationState) => void;
  onStart: () => void | Promise<void>;
}

export interface LiveLogMonitorSetupDeckViewModel {
  workflowStripProps: ComponentProps<typeof LiveLogMonitorWorkflowStrip>;
  basePlaylistPanelProps: ComponentProps<typeof LiveLogMonitorBasePlaylistPanel>;
  launchPanelProps: ComponentProps<typeof LiveLogMonitorLaunchPanel>;
}
