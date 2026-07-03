import type { AppTranslations } from "../../i18n/types";
import type { BaseTrackPlaylist, LibraryTrack } from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { getTrackTitle } from "../../utils/track";

export interface PlaylistTrackOptionViewModel {
  id: string;
  checked: boolean;
  title: string;
  detail: string;
}

export interface PlaylistCardViewModel {
  id: string;
  isSelected: boolean;
  name: string;
  meta: string;
  preview: string;
  playlist: BaseTrackPlaylist;
}

export interface LibraryPlaylistsViewModel {
  trackOptions: PlaylistTrackOptionViewModel[];
  cards: PlaylistCardViewModel[];
  editorActionLabel: string;
  emptyMessage: string;
}

export function buildLibraryPlaylistsViewModel(input: {
  playlistEditorId: string | null;
  playlistTrackIds: string[];
  playlists: BaseTrackPlaylist[];
  selectedPlaylistId: string | null;
  t: AppTranslations;
  tracks: LibraryTrack[];
}): LibraryPlaylistsViewModel {
  const { playlistEditorId, playlistTrackIds, playlists, selectedPlaylistId, t, tracks } = input;

  const trackOptions = tracks.map((track) => ({
    id: track.id,
    checked: playlistTrackIds.includes(track.id),
    title: getTrackTitle(track),
    detail: [
      track.analysis.bpm ? `${Math.round(track.analysis.bpm)} BPM` : t.library.noBpm,
      track.file.availabilityState === "missing" ? t.library.lost.toUpperCase() : null,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" · "),
  }));

  const cards = playlists.map((playlist) => ({
    id: playlist.id,
    isSelected: playlist.id === selectedPlaylistId,
    name: playlist.name,
    playlist,
    meta: `${playlist.trackIds.length} ${t.library.sounds.toLowerCase()} · ${formatShortDate(
      playlist.updatedAt,
    )}`,
    preview:
      playlist.trackIds
        .map((trackId) => tracks.find((track) => track.id === trackId))
        .filter((track): track is LibraryTrack => track !== undefined)
        .slice(0, 3)
        .map((track) => getTrackTitle(track))
        .join(" · ") || t.library.noTracksAssigned,
  }));

  return {
    trackOptions,
    cards,
    editorActionLabel: playlistEditorId ? t.library.updatePlaylist : t.library.savePlaylist,
    emptyMessage: t.library.noBasePlaylists,
  };
}
