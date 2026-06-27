import type { AppTranslations } from "../../i18n/en";
import type { RepositoryAnalysis } from "../../types/library";
import { formatShortDate } from "../../utils/date";
import { resolveLibrarySourceKindLabel } from "./libraryScreenViewModel";

export interface LibrarySourceCardViewModel {
  id: string;
  isSelected: boolean;
  isNewlyImported: boolean;
  title: string;
  meta: string;
  importedAtLabel: string;
  shouldAnalyze: boolean;
  actionLabel: string;
}

export function buildLibrarySourcesViewModel(input: {
  newlyImportedId?: string | null;
  repositories: RepositoryAnalysis[];
  selectedRepositoryId: string | null;
  t: AppTranslations;
}): LibrarySourceCardViewModel[] {
  const { newlyImportedId, repositories, selectedRepositoryId, t } = input;

  return repositories.map((repository) => {
    const metaParts = [
      resolveLibrarySourceKindLabel(repository.sourceKind, t),
      repository.suggestedBpm ? `${Math.round(repository.suggestedBpm)} BPM` : "-",
      repository.primaryLanguage || null,
    ].filter((value): value is string => Boolean(value));

    return {
      id: repository.id,
      isSelected: repository.id === selectedRepositoryId,
      isNewlyImported: repository.id === newlyImportedId,
      title: repository.title,
      meta: metaParts.join(" · "),
      importedAtLabel: formatShortDate(repository.importedAt),
      shouldAnalyze: !repository.suggestedBpm,
      actionLabel: repository.suggestedBpm ? t.library.view : t.library.analyze,
    };
  });
}
