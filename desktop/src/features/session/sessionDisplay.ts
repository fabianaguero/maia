import type { AppTranslations } from "../../i18n/en";
import { convertFileSrc, isTauri } from "@tauri-apps/api/core";
import { SOURCE_TEMPLATES, resolveSourceTemplatePresentation } from "../../config/sourceTemplates";
import { getPlaylistMedianBpm } from "../../utils/playlist";
import { getTrackTitle, resolvePlayableTrackPath } from "../../utils/track";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { PersistedSession } from "../../api/sessions";

export type QuickSessionMode = "log" | "repo";
export type SessionBaseMode = "track" | "playlist";

export function formatMonitorConfidence(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

export function formatMonitorLevel(
  level: string | null | undefined,
  awaitingInputLabel: string,
): string {
  if (!level) {
    return awaitingInputLabel;
  }

  return level
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function resolveSessionTemplateLabel(
  sourceTemplateId: string | null | undefined,
  t: AppTranslations,
  noTemplateLabel: string,
  unknownTemplateLabel: string,
): string {
  if (!sourceTemplateId) {
    return noTemplateLabel;
  }

  const found = SOURCE_TEMPLATES.find((template) => template.id === sourceTemplateId);
  if (!found) {
    return unknownTemplateLabel;
  }

  return resolveSourceTemplatePresentation(found, t)?.label ?? found.label;
}

export function resolveModeLabel(
  mode: QuickSessionMode,
  logLabel: string,
  repositoryLabel: string,
): string {
  return mode === "log" ? logLabel : repositoryLabel;
}

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

export function resolveSourceDetails(
  session: PersistedSession | null,
  repositories: RepositoryAnalysis[],
): { label: string | null; path: string | null } {
  if (!session) {
    return { label: null, path: null };
  }

  const repository =
    (session.sourceId ? repositories.find((entry) => entry.id === session.sourceId) : null) ??
    repositories.find(
      (entry) => session.sourcePath !== null && entry.sourcePath === session.sourcePath,
    ) ??
    null;

  return {
    label: repository?.title ?? session.sourceTitle ?? null,
    path: repository?.sourcePath ?? session.sourcePath ?? null,
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

export function resolveSessionBedUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (isTauri()) {
    return convertFileSrc(path);
  }

  return null;
}
