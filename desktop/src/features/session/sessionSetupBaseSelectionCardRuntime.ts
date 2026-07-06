import type { AppTranslations } from "../../i18n/types";
import type { BaseTrackPlaylist, LibraryTrack } from "../../types/library";
import { getPlaylistMedianBpm } from "../../utils/playlist";
import { getTrackTitle } from "../../utils/track";
import type { SessionBaseMode } from "./sessionDisplay";

export function buildSessionSetupBaseModeTabs(input: {
  t: AppTranslations;
  baseMode: SessionBaseMode;
  trackCount: number;
  playlistCount: number;
}) {
  return [
    {
      id: "track" as const,
      label: input.t.session.track,
      active: input.baseMode === "track",
      disabled: input.trackCount === 0,
    },
    {
      id: "playlist" as const,
      label: input.t.session.playlist,
      active: input.baseMode === "playlist",
      disabled: input.playlistCount === 0,
    },
  ];
}

export function resolveSessionSetupBaseEmptyState(input: {
  t: AppTranslations;
  baseMode: SessionBaseMode;
  trackCount: number;
  playlistCount: number;
}): string | null {
  if (input.baseMode === "track" && input.trackCount === 0) {
    return input.t.session.noTracks;
  }

  if (input.baseMode === "playlist" && input.playlistCount === 0) {
    return input.t.session.noPlaylists;
  }

  return null;
}

export function buildSessionSetupTrackOptions(input: {
  tracks: LibraryTrack[];
  selectedTrackId: string | null;
}) {
  return input.tracks.map((track) => ({
    id: track.id,
    selected: input.selectedTrackId === track.id,
    title: getTrackTitle(track),
    detail: `${track.analysis.bpm?.toFixed(0) ?? "—"} BPM`,
  }));
}

export function buildSessionSetupPlaylistOptions(input: {
  playlists: BaseTrackPlaylist[];
  tracks: LibraryTrack[];
  selectedPlaylistId: string | null;
  t: AppTranslations;
}) {
  return input.playlists.map((playlist) => ({
    id: playlist.id,
    selected: input.selectedPlaylistId === playlist.id,
    title: playlist.name,
    detail: `${playlist.trackIds.length} ${input.t.library.sounds.toLowerCase()} · ${
      input.t.session.median
    } ${getPlaylistMedianBpm(playlist, input.tracks)?.toFixed(0) ?? "?"} BPM`,
  }));
}

export function buildSessionSetupBaseSummary(input: {
  t: AppTranslations;
  selectedBaseLabel: string | null;
  selectedBaseDetail: string | null;
}) {
  if (!input.selectedBaseLabel) {
    return null;
  }

  return {
    eyebrow: input.t.session.armed,
    title: input.selectedBaseLabel,
    detail: input.selectedBaseDetail,
  };
}
