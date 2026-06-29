import type { BaseTrackPlaylist, LibraryTrack } from "../../../types/library";
import { createBasePlaylist } from "../../../utils/monitorPrefs";

function withUpdatedTrackIds(playlist: BaseTrackPlaylist, trackIds: string[]): BaseTrackPlaylist {
  return {
    ...playlist,
    trackIds,
    updatedAt: new Date().toISOString(),
  };
}

export function renameLiveMonitorBasePlaylist(
  current: BaseTrackPlaylist | null,
  name: string,
): BaseTrackPlaylist {
  if (current) {
    return {
      ...current,
      name,
      updatedAt: new Date().toISOString(),
    };
  }

  return createBasePlaylist([], name || "Base playlist");
}

export function addTrackToLiveMonitorBasePlaylist(
  current: BaseTrackPlaylist | null,
  trackId: string,
): BaseTrackPlaylist | null {
  if (!trackId) {
    return current;
  }

  const existingTrackIds = current?.trackIds ?? [];
  if (existingTrackIds.includes(trackId)) {
    return current;
  }

  if (current) {
    return withUpdatedTrackIds(current, [...current.trackIds, trackId]);
  }

  return createBasePlaylist([trackId]);
}

export function loadSavedLiveMonitorBasePlaylist(
  playlist: BaseTrackPlaylist | null,
  availableTracks: LibraryTrack[],
): BaseTrackPlaylist | null {
  if (!playlist) {
    return null;
  }

  const availableTrackIds = new Set(availableTracks.map((track) => track.id));
  return {
    ...playlist,
    trackIds: playlist.trackIds.filter((trackId) => availableTrackIds.has(trackId)),
  };
}

export function moveTrackWithinLiveMonitorBasePlaylist(
  current: BaseTrackPlaylist | null,
  trackId: string,
  direction: "up" | "down",
): BaseTrackPlaylist | null {
  if (!current) {
    return current;
  }

  const index = current.trackIds.indexOf(trackId);
  if (index === -1) {
    return current;
  }

  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= current.trackIds.length) {
    return current;
  }

  const nextTrackIds = [...current.trackIds];
  [nextTrackIds[index], nextTrackIds[nextIndex]] = [nextTrackIds[nextIndex], nextTrackIds[index]];
  return withUpdatedTrackIds(current, nextTrackIds);
}

export function removeTrackFromLiveMonitorBasePlaylist(
  current: BaseTrackPlaylist | null,
  trackId: string,
): BaseTrackPlaylist | null {
  if (!current) {
    return current;
  }

  return withUpdatedTrackIds(
    current,
    current.trackIds.filter((id) => id !== trackId),
  );
}
