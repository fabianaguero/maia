import { getPlaylistMedianBpm } from "../../utils/playlist";
import { getTrackTitle, resolvePlayableTrackPath } from "../../utils/track";
import type { BaseTrackPlaylist, LibraryTrack } from "../../types/library";
import type { PersistedSession } from "../../api/sessions";
import type { SessionBaseMode } from "./sessionDisplay";

export function resolveBaseDetails(
  session: PersistedSession | null,
  tracks: LibraryTrack[],
  playlists: BaseTrackPlaylist[],
): { label: string | null; detail: string | null } {
  if (!session) {
    return { label: null, detail: null };
  }

  if (session.playlistId) {
    const playlist = playlists.find((entry) => entry.id === session.playlistId) ?? null;
    const label = playlist?.name ?? session.playlistName ?? null;
    const medianBpm = playlist ? getPlaylistMedianBpm(playlist, tracks) : null;

    return {
      label,
      detail: playlist
        ? `${playlist.trackIds.length} tracks · median ${medianBpm?.toFixed(0) ?? "?"} BPM`
        : null,
    };
  }

  if (session.trackId) {
    const track = tracks.find((entry) => entry.id === session.trackId) ?? null;
    const label = track ? getTrackTitle(track) : (session.trackTitle ?? null);

    return {
      label,
      detail:
        typeof track?.analysis.bpm === "number" ? `${track.analysis.bpm.toFixed(0)} BPM` : null,
    };
  }

  return { label: null, detail: null };
}

export function resolveSelectedBaseDetails(
  baseMode: SessionBaseMode,
  selectedTrack: LibraryTrack | null,
  selectedPlaylist: BaseTrackPlaylist | null,
  tracks: LibraryTrack[],
): { label: string | null; detail: string | null } {
  if (baseMode === "playlist") {
    const selectedPlaylistBpm = getPlaylistMedianBpm(selectedPlaylist, tracks);
    return {
      label: selectedPlaylist?.name ?? null,
      detail: selectedPlaylist
        ? `${selectedPlaylist.trackIds.length} tracks · median ${selectedPlaylistBpm?.toFixed(0) ?? "?"} BPM`
        : null,
    };
  }

  return {
    label: selectedTrack?.tags.title ?? null,
    detail: selectedTrack ? `${selectedTrack.analysis.bpm?.toFixed(0) ?? "?"} BPM` : null,
  };
}

export function resolveSessionBedPath(
  session: PersistedSession | null,
  tracks: LibraryTrack[],
  playlists: BaseTrackPlaylist[],
): string | null {
  if (!session) {
    return null;
  }

  if (session.playlistId) {
    const playlist = playlists.find((entry) => entry.id === session.playlistId) ?? null;
    if (!playlist) {
      return null;
    }

    for (const trackId of playlist.trackIds) {
      const track = tracks.find((entry) => entry.id === trackId) ?? null;
      const path = track ? resolvePlayableTrackPath(track) : null;
      if (path) {
        return path;
      }
    }

    return null;
  }

  if (!session.trackId) {
    return null;
  }

  const track = tracks.find((entry) => entry.id === session.trackId) ?? null;
  return track ? resolvePlayableTrackPath(track) : null;
}
