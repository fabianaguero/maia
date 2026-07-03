import type { Dispatch, SetStateAction } from "react";

import type { AppTranslations } from "../../../i18n/types";
import type { BaseTrackPlaylist, LibraryTrack, StreamAdapterKind } from "../../../types/library";
import { LiveLogMonitorSetupDeck } from "./LiveLogMonitorSetupDeck";
import { buildLiveLogMonitorSetupDeckViewModel } from "./liveLogMonitorSetupSectionRuntime";
import type { ForcedLiveMutationState } from "./liveLogMonitorViewModel";
import type {
  BasePlaylistEditorItem,
  BasePlaylistTrackOption,
  ProfileOption,
  SavedPlaylistOption,
} from "./liveLogMonitorSetupSectionRuntime";

interface LiveLogMonitorSetupSectionProps {
  visible: boolean;
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

export function LiveLogMonitorSetupSection({
  visible,
  t,
  adapterKind,
  adapterDescription,
  adapterTarget,
  selectedStyleProfileId,
  selectedMutationProfileId,
  selectedStyleProfile,
  selectedMutationProfile,
  forcedLiveMutationState,
  hasBaseListeningBed,
  baseTrackCount,
  adapterConfigured,
  cueEnginePreviewLabel,
  liveMutationStateLabel,
  error,
  isStarting,
  pendingAddTrackId,
  pendingLoadPlaylistId,
  basePlaylist,
  basePlaylistTrackOptions,
  savedPlaylistOptions,
  basePlaylistEditorItems,
  availablePlaylists,
  availableTracks,
  setBasePlaylist,
  setPendingAddTrackId,
  setPendingLoadPlaylistId,
  setAdapterKind,
  setSelectedStyleProfileId,
  setSelectedMutationProfileId,
  setForcedLiveMutationState,
  onStart,
}: LiveLogMonitorSetupSectionProps) {
  const viewModel = buildLiveLogMonitorSetupDeckViewModel({
    t,
    adapterKind,
    adapterDescription,
    adapterTarget,
    selectedStyleProfileId,
    selectedMutationProfileId,
    selectedStyleProfile,
    selectedMutationProfile,
    forcedLiveMutationState,
    hasBaseListeningBed,
    baseTrackCount,
    adapterConfigured,
    cueEnginePreviewLabel,
    liveMutationStateLabel,
    error,
    isStarting,
    pendingAddTrackId,
    pendingLoadPlaylistId,
    basePlaylist,
    basePlaylistTrackOptions,
    savedPlaylistOptions,
    basePlaylistEditorItems,
    availablePlaylists,
    availableTracks,
    setBasePlaylist,
    setPendingAddTrackId,
    setPendingLoadPlaylistId,
    setAdapterKind,
    setSelectedStyleProfileId,
    setSelectedMutationProfileId,
    setForcedLiveMutationState,
    onStart,
  });

  return (
    <LiveLogMonitorSetupDeck
      visible={visible}
      workflowStripProps={viewModel.workflowStripProps}
      basePlaylistPanelProps={viewModel.basePlaylistPanelProps}
      launchPanelProps={viewModel.launchPanelProps}
    />
  );
}
