import type { BaseTrackPlaylist, LibraryTrack } from "../../../types/library";
import {
  buildBasePlaylistTrackOptions,
  buildPlaylistEditorItems,
  buildPlaylistSummaryItems,
  buildSavedPlaylistOptions,
} from "./liveLogMonitorPlaylistViewState";

export function buildLiveLogMonitorPanelPlaylistCollections(input: {
  availableTracks: LibraryTrack[];
  availableBaseTrackOptions: LibraryTrack[];
  availablePlaylists: BaseTrackPlaylist[];
  basePlaylist: BaseTrackPlaylist | null;
  lostLabel: string;
}) {
  return {
    playlistSummaryItems: buildPlaylistSummaryItems(
      input.basePlaylist?.trackIds,
      input.availableTracks,
    ),
    basePlaylistEditorItems: buildPlaylistEditorItems(
      input.basePlaylist?.trackIds,
      input.availableTracks,
    ),
    basePlaylistTrackOptions: buildBasePlaylistTrackOptions(
      input.availableBaseTrackOptions,
      input.lostLabel,
    ),
    savedPlaylistOptions: buildSavedPlaylistOptions(input.availablePlaylists),
  };
}
