import type { PersistedSession } from "../../api/sessions";
import type { LibraryTrack } from "../../types/library";
import { resolvePlayableTrackPath } from "../../utils/trackPlayback";

export function isLocalFilesystemPath(path: string | null | undefined): path is string {
  return typeof path === "string" && path.length > 0 && !path.includes("://");
}

export function collectLocalSessionSourcePaths(sessions: PersistedSession[]): string[] {
  return Array.from(
    new Set(
      sessions
        .map((session) => session.sourcePath)
        .filter((path): path is string => isLocalFilesystemPath(path)),
    ),
  );
}

export function collectReplayTrackLocalPaths(
  sessions: PersistedSession[],
  tracks: LibraryTrack[],
): Array<readonly [trackId: string, path: string]> {
  const replayTrackIds = new Set(sessions.map((session) => session.trackId).filter(Boolean));

  return tracks
    .filter((track) => replayTrackIds.has(track.id))
    .map((track) => {
      const path = resolvePlayableTrackPath(track);
      return isLocalFilesystemPath(path) ? ([track.id, path] as const) : null;
    })
    .filter((entry): entry is readonly [trackId: string, path: string] => entry !== null);
}
