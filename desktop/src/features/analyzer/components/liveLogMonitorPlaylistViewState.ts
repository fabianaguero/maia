import type { BaseTrackPlaylist, LibraryTrack } from "../../../types/library";
import { getTrackAvailabilityLabel, getTrackTitle } from "../../../utils/track";

export interface LiveLogMonitorPlaylistSummaryItem {
  id: string;
  title: string;
  lostTitle: string | null;
}

export interface LiveLogMonitorPlaylistEditorItem {
  id: string;
  label: string;
  lostTitle: string | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export interface LiveLogMonitorTrackOption {
  id: string;
  label: string;
  disabled: boolean;
}

export interface LiveLogMonitorSavedPlaylistOption {
  id: string;
  label: string;
}

function formatTrackWithBpm(track: LibraryTrack): string {
  return `${getTrackTitle(track)}${
    track.analysis.bpm !== null ? ` · ${track.analysis.bpm.toFixed(0)} BPM` : ""
  }`;
}

export function buildPlaylistSummaryItems(
  trackIds: readonly string[] | null | undefined,
  availableTracks: readonly LibraryTrack[],
): LiveLogMonitorPlaylistSummaryItem[] {
  return (trackIds ?? [])
    .map((id) => {
      const track = availableTracks.find((candidate) => candidate.id === id);
      if (!track) {
        return null;
      }

      return {
        id,
        title: formatTrackWithBpm(track),
        lostTitle: track.file.availabilityState === "missing" ? getTrackAvailabilityLabel(track) : null,
      };
    })
    .filter((item): item is LiveLogMonitorPlaylistSummaryItem => item !== null);
}

export function buildPlaylistEditorItems(
  trackIds: readonly string[] | null | undefined,
  availableTracks: readonly LibraryTrack[],
): LiveLogMonitorPlaylistEditorItem[] {
  return (trackIds ?? [])
    .map((id, index, ids) => {
      const track = availableTracks.find((candidate) => candidate.id === id);
      if (!track) {
        return null;
      }

      return {
        id,
        label: formatTrackWithBpm(track),
        lostTitle: track.file.availabilityState === "missing" ? getTrackAvailabilityLabel(track) : null,
        canMoveUp: index > 0,
        canMoveDown: index < ids.length - 1,
      };
    })
    .filter((item): item is LiveLogMonitorPlaylistEditorItem => item !== null);
}

export function buildBasePlaylistTrackOptions(
  availableTracks: readonly LibraryTrack[],
  lostUpperLabel: string,
): LiveLogMonitorTrackOption[] {
  return availableTracks.map((track) => ({
    id: track.id,
    label: `${formatTrackWithBpm(track)}${
      track.file.availabilityState === "missing" ? ` · ${lostUpperLabel}` : ""
    }`,
    disabled: track.file.availabilityState === "missing",
  }));
}

export function buildSavedPlaylistOptions(
  playlists: readonly BaseTrackPlaylist[],
): LiveLogMonitorSavedPlaylistOption[] {
  return playlists.map((playlist) => ({
    id: playlist.id,
    label: `${playlist.name} · ${playlist.trackIds.length} tracks`,
  }));
}

export function buildNowPlayingSummary(
  liveEnabled: boolean,
  track: LibraryTrack | null,
  prefix: string,
): string | null {
  if (!liveEnabled || !track) {
    return null;
  }

  return `${prefix}: ${formatTrackWithBpm(track)}`;
}

export function buildUpNextSummary(
  liveEnabled: boolean,
  track: LibraryTrack | null,
  transitionSummary: string | null,
  prefix: string,
): string | null {
  if (!liveEnabled || !track || !transitionSummary) {
    return null;
  }

  return `${prefix}: ${getTrackTitle(track)} · ${transitionSummary}`;
}
