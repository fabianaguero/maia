import type { BaseTrackPlaylist, LibraryTrack } from "../types/library";
import { getTrackTitle } from "./track";

export function resolvePlaylistTracks(
  playlist: BaseTrackPlaylist | null | undefined,
  tracks: readonly LibraryTrack[],
): LibraryTrack[] {
  if (!playlist) {
    return [];
  }

  return playlist.trackIds
    .map((trackId) => tracks.find((track) => track.id === trackId) ?? null)
    .filter((track): track is LibraryTrack => track !== null);
}

export function findPlaylistLeadTrack(
  playlist: BaseTrackPlaylist | null | undefined,
  tracks: readonly LibraryTrack[],
): LibraryTrack | null {
  return (
    resolvePlaylistTracks(playlist, tracks).find(
      (track) => track.file.availabilityState !== "missing",
    ) ?? null
  );
}

export function getPlaylistMedianBpm(
  playlist: BaseTrackPlaylist | null | undefined,
  tracks: readonly LibraryTrack[],
): number | null {
  const bpms = resolvePlaylistTracks(playlist, tracks)
    .map((track) => track.analysis.bpm)
    .filter((bpm): bpm is number => typeof bpm === "number" && Number.isFinite(bpm));

  if (bpms.length === 0) {
    return null;
  }

  const sorted = [...bpms].sort((left, right) => left - right);
  const midpoint = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[midpoint - 1] + sorted[midpoint]) / 2
      : sorted[midpoint];

  return Number(median.toFixed(1));
}

export function summarizePlaylistTracks(
  playlist: BaseTrackPlaylist | null | undefined,
  tracks: readonly LibraryTrack[],
): string {
  const playlistTracks = resolvePlaylistTracks(playlist, tracks);

  if (playlistTracks.length === 0) {
    return "No linked tracks";
  }

  if (playlistTracks.length === 1) {
    return getTrackTitle(playlistTracks[0]);
  }

  const leadTitles = playlistTracks.slice(0, 2).map((track) => getTrackTitle(track));
  const remainder = playlistTracks.length - leadTitles.length;

  return remainder > 0
    ? `${leadTitles.join(" · ")} +${remainder}`
    : leadTitles.join(" · ");
}
