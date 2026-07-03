import type { BaseTrackPlaylist, LibraryTrack } from "../../../types/library";
import {
  buildBasePlaylistTrackOptions,
  buildPlaylistEditorItems,
  buildPlaylistSummaryItems,
  buildSavedPlaylistOptions,
} from "./liveLogMonitorPlaylistViewState";
import { buildLiveLogMonitorPanelPlaylistCollections } from "./liveLogMonitorPanelPlaylistCollectionsRuntime";
import { buildLiveLogMonitorPanelPlaylistSummaries } from "./liveLogMonitorPanelPlaylistSummariesRuntime";
import type { PlaylistTransitionPlan } from "../../../utils/playlistTransition";

export interface LiveLogMonitorPanelPlaylistStateInput {
  availableTracks: LibraryTrack[];
  availableBaseTrackOptions: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
  basePlaylist: BaseTrackPlaylist | null;
  backgroundNowPlayingTrack: LibraryTrack | null;
  backgroundTransitionNextTrack: LibraryTrack | null;
  backgroundTransitionPlan: PlaylistTransitionPlan | null;
  liveEnabled: boolean;
  nowPlayingLabel: string;
  upNextLabel: string;
  lostLabel: string;
}

export interface LiveLogMonitorPanelPlaylistState {
  playlistSummaryItems: ReturnType<typeof buildPlaylistSummaryItems>;
  basePlaylistEditorItems: ReturnType<typeof buildPlaylistEditorItems>;
  basePlaylistTrackOptions: ReturnType<typeof buildBasePlaylistTrackOptions>;
  savedPlaylistOptions: ReturnType<typeof buildSavedPlaylistOptions>;
  nowPlayingSummary: string | null;
  upNextSummary: string | null;
}

export function buildLiveLogMonitorPanelPlaylistState(
  input: LiveLogMonitorPanelPlaylistStateInput,
): LiveLogMonitorPanelPlaylistState {
  const collections = buildLiveLogMonitorPanelPlaylistCollections({
    availableTracks: input.availableTracks,
    availableBaseTrackOptions: input.availableBaseTrackOptions,
    availablePlaylists: input.availablePlaylists,
    basePlaylist: input.basePlaylist,
    lostLabel: input.lostLabel,
  });
  const summaries = buildLiveLogMonitorPanelPlaylistSummaries({
    liveEnabled: input.liveEnabled,
    backgroundNowPlayingTrack: input.backgroundNowPlayingTrack,
    backgroundTransitionNextTrack: input.backgroundTransitionNextTrack,
    transitionSummary: input.backgroundTransitionPlan?.summary ?? null,
    nowPlayingLabel: input.nowPlayingLabel,
    upNextLabel: input.upNextLabel,
  });

  return {
    ...collections,
    ...summaries,
  };
}
