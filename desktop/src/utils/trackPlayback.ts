import type { LibraryTrack } from "../types/library";

export function getTrackTitle(track: LibraryTrack): string {
  const title = track.tags.title?.trim();
  if (title) {
    return title;
  }

  const sourcePath = track.file.sourcePath?.trim() || track.sourcePath?.trim();
  if (sourcePath) {
    const basename = sourcePath.split("/").pop()?.trim();
    if (basename) {
      return basename;
    }
  }

  return "Untitled Track";
}

export function getTrackSourcePath(track: LibraryTrack): string {
  return track.file.sourcePath;
}

export function getTrackStoragePath(track: LibraryTrack): string | null {
  return track.file.storagePath;
}

function isBrowserFallbackPath(path: string | null): boolean {
  return typeof path === "string" && path.startsWith("browser-fallback://");
}

export function describeTrackStorage(track: LibraryTrack): string {
  const storagePath = getTrackStoragePath(track);
  const sourcePath = getTrackSourcePath(track);

  if (!storagePath) {
    return "Original/demo path";
  }

  if (isBrowserFallbackPath(storagePath)) {
    return "Simulated snapshot";
  }

  if (storagePath === sourcePath) {
    return "Legacy/original path";
  }

  return "Managed snapshot";
}

export function describeTrackPlaybackSource(track: LibraryTrack): string {
  const storagePath = getTrackStoragePath(track);
  const sourcePath = getTrackSourcePath(track);

  if (!storagePath && !sourcePath) {
    return "Unavailable";
  }

  if (isBrowserFallbackPath(storagePath) || isBrowserFallbackPath(sourcePath)) {
    return "Browser fallback";
  }

  if (track.file.playbackSource === "managed_snapshot") {
    return "Managed snapshot";
  }

  if (track.file.playbackSource === "source_file") {
    return "Original file";
  }

  return "Unavailable";
}

export function resolvePlayableTrackPath(track: LibraryTrack): string | null {
  if (track.file.availabilityState === "missing") {
    return null;
  }

  const storagePath = getTrackStoragePath(track);
  const sourcePath = getTrackSourcePath(track);

  if (storagePath && !isBrowserFallbackPath(storagePath)) {
    return storagePath;
  }

  if (sourcePath && !isBrowserFallbackPath(sourcePath)) {
    return sourcePath;
  }

  return null;
}

export function getTrackAvailabilityLabel(track: LibraryTrack): string {
  return track.file.availabilityState === "missing" ? "Missing" : "Available";
}
