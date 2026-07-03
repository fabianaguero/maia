import type { AppTranslations } from "../../i18n/types";
import type { LibraryTrack } from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { getTrackTitle } from "../../utils/track";

export interface LibraryTrackCardViewModel {
  id: string;
  isMissing: boolean;
  isSelected: boolean;
  isNewlyImported: boolean;
  shouldAnalyze: boolean;
  title: string;
  meta: string;
  importedAtLabel: string;
  actionLabel: string;
}

export function formatTrackDuration(durationSeconds: number | null): string | null {
  if (!durationSeconds) {
    return null;
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.round(durationSeconds % 60);

  return `${minutes}m${seconds}s`;
}

export function buildLibraryTracksViewModel(input: {
  newlyImportedId?: string | null;
  selectedTrackId: string | null;
  t: AppTranslations;
  tracks: LibraryTrack[];
}): LibraryTrackCardViewModel[] {
  const { newlyImportedId, selectedTrackId, t, tracks } = input;

  return tracks.map((track) => {
    const metaParts = [
      track.analysis.bpm ? `${Math.round(track.analysis.bpm)} BPM` : "-",
      track.file.availabilityState === "missing" ? t.library.lost.toUpperCase() : null,
      formatTrackDuration(track.analysis.durationSeconds),
      track.tags.musicStyleLabel,
      track.file.fileExtension,
    ].filter((value): value is string => Boolean(value));

    return {
      id: track.id,
      isMissing: track.file.availabilityState === "missing",
      isSelected: track.id === selectedTrackId,
      isNewlyImported: track.id === newlyImportedId,
      shouldAnalyze: !track.analysis.bpm,
      title: getTrackTitle(track),
      meta: metaParts.join(" · "),
      importedAtLabel: formatShortDate(track.analysis.importedAt),
      actionLabel: track.analysis.bpm ? t.library.view : t.library.analyze,
    };
  });
}
