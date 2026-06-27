import type { MusicalAsset } from "../contracts";
import type {
  BaseTrackPlaylist,
  ImportTrackInput,
  LibraryTrack,
  RelinkMissingTracksResult,
} from "../types/library";

export function toLibraryErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Unexpected library failure.";
}

export function sortTracksByImportedAt(tracks: LibraryTrack[]): LibraryTrack[] {
  return [...tracks].sort((left, right) =>
    right.analysis.importedAt.localeCompare(left.analysis.importedAt),
  );
}

export function sortPlaylistsByUpdatedAt(playlists: BaseTrackPlaylist[]): BaseTrackPlaylist[] {
  return [...playlists].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function resolveSelectedTrackId(
  current: string | null,
  tracks: LibraryTrack[],
): string | null {
  if (current && tracks.some((track) => track.id === current)) {
    return current;
  }

  return tracks[0]?.id ?? null;
}

export function resolveSelectedPlaylistId(
  current: string | null,
  playlists: BaseTrackPlaylist[],
): string | null {
  if (current && playlists.some((playlist) => playlist.id === current)) {
    return current;
  }

  return playlists[0]?.id ?? null;
}

export function appendImportedTrack(
  tracks: LibraryTrack[],
  nextTrack: LibraryTrack,
): LibraryTrack[] {
  return sortTracksByImportedAt([
    nextTrack,
    ...tracks.filter((track) => track.id !== nextTrack.id),
  ]);
}

export function shouldAnalyzeImportedTrack(track: LibraryTrack): boolean {
  return track.analysis.analyzerStatus === "pending";
}

export function applyAnalyzedTrackMetadata(
  tracks: LibraryTrack[],
  trackId: string,
  analyzed: MusicalAsset,
): LibraryTrack[] {
  return sortTracksByImportedAt(
    tracks.map((track) =>
      track.id === trackId
        ? {
            ...track,
            analysis: {
              ...track.analysis,
              bpm: analyzed.suggestedBpm ?? track.analysis.bpm,
              bpmConfidence: analyzed.confidence ?? track.analysis.bpmConfidence,
              waveformBins: analyzed.artifacts?.waveformBins ?? track.analysis.waveformBins,
              beatGrid: analyzed.artifacts?.beatGrid ?? track.analysis.beatGrid,
              bpmCurve: analyzed.artifacts?.bpmCurve ?? track.analysis.bpmCurve,
            },
            bpm: analyzed.suggestedBpm ?? track.analysis.bpm,
            bpmConfidence: analyzed.confidence ?? track.analysis.bpmConfidence,
            waveformBins: analyzed.artifacts?.waveformBins ?? track.analysis.waveformBins,
            beatGrid: analyzed.artifacts?.beatGrid ?? track.analysis.beatGrid,
            bpmCurve: analyzed.artifacts?.bpmCurve ?? track.analysis.bpmCurve,
          }
        : track,
    ),
  );
}

export function resolveReanalyzeTrackInput(track: LibraryTrack): ImportTrackInput {
  return {
    title: track.tags.title,
    sourcePath: track.file.sourcePath,
    musicStyleId: track.tags.musicStyleId,
  };
}

export function replaceTrack(
  tracks: LibraryTrack[],
  trackId: string,
  nextTrack: LibraryTrack,
): LibraryTrack[] {
  return sortTracksByImportedAt(
    tracks.map((track) => (track.id === trackId ? nextTrack : track)),
  );
}

export function removeDeletedTrack(tracks: LibraryTrack[], trackId: string): LibraryTrack[] {
  return tracks.filter((track) => track.id !== trackId);
}

export function removeTrackFromPlaylists(
  playlists: BaseTrackPlaylist[],
  trackId: string,
): BaseTrackPlaylist[] {
  return playlists.map((playlist) => ({
    ...playlist,
    trackIds: playlist.trackIds.filter((id) => id !== trackId),
  }));
}

export function clearDeletedTrackSelection(
  selectedTrackId: string | null,
  trackId: string,
): string | null {
  return selectedTrackId === trackId ? null : selectedTrackId;
}

export function replaceRelinkedTracks(
  tracks: LibraryTrack[],
  result: RelinkMissingTracksResult,
): LibraryTrack[] {
  return sortTracksByImportedAt(
    tracks.map((track) => result.relinkedTracks.find((entry) => entry.id === track.id) ?? track),
  );
}

export function resolvePreferredRelinkSelection(
  result: RelinkMissingTracksResult,
): string | null {
  return result.relinkedTracks[0]?.id ?? null;
}

export function appendSavedPlaylist(
  playlists: BaseTrackPlaylist[],
  nextPlaylist: BaseTrackPlaylist,
): BaseTrackPlaylist[] {
  return sortPlaylistsByUpdatedAt([
    nextPlaylist,
    ...playlists.filter((playlist) => playlist.id !== nextPlaylist.id),
  ]);
}

export function removeDeletedPlaylist(
  playlists: BaseTrackPlaylist[],
  playlistId: string,
): BaseTrackPlaylist[] {
  return playlists.filter((playlist) => playlist.id !== playlistId);
}

export function clearDeletedPlaylistSelection(
  selectedPlaylistId: string | null,
  playlistId: string,
): string | null {
  return selectedPlaylistId === playlistId ? null : selectedPlaylistId;
}
