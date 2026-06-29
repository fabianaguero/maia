import type { LibraryTrack, RepositoryAnalysis } from "../../types/library";

export function countMissingLibraryTracks(tracks: LibraryTrack[]): number {
  return tracks.filter((track) => track.file.availabilityState === "missing").length;
}

export function resolveTrackCleanupCandidates(tracks: LibraryTrack[]): string[] {
  return tracks.filter((track) => !track.analysis.bpm).map((track) => track.id);
}

export function resolveRepositoryCleanupCandidates(repositories: RepositoryAnalysis[]): string[] {
  return repositories
    .filter((repository) => !repository.suggestedBpm)
    .map((repository) => repository.id);
}
