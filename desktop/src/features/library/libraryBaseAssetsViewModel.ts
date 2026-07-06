import type { AppTranslations } from "../../i18n/types";
import type { BaseAssetRecord } from "../../types/library";
import { formatShortDate } from "../../utils/date";
import {
  resolveLibraryStatusBadgeClass,
  resolveLibraryStatusLabel,
} from "./libraryScreenViewModel";

export interface LibraryBaseAssetCardViewModel {
  id: string;
  isSelected: boolean;
  isNewlyImported: boolean;
  title: string;
  meta: string;
  importedAtLabel: string;
  statusClassName: string;
  statusLabel: string;
  showComposeAction: boolean;
}

export function buildLibraryBaseAssetsViewModel(input: {
  assets: BaseAssetRecord[];
  newlyImportedId?: string | null;
  selectedBaseAssetId: string | null;
  t: AppTranslations;
}): LibraryBaseAssetCardViewModel[] {
  const { assets, newlyImportedId, selectedBaseAssetId, t } = input;

  return assets.map((asset) => ({
    id: asset.id,
    isSelected: asset.id === selectedBaseAssetId,
    isNewlyImported: asset.id === newlyImportedId,
    title: asset.title,
    meta: [
      asset.categoryLabel,
      `${asset.entryCount} ${t.library.entries}`,
      asset.reusable ? t.library.reusable : null,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" · "),
    importedAtLabel: formatShortDate(asset.importedAt),
    statusClassName: resolveLibraryStatusBadgeClass(asset.analyzerStatus),
    statusLabel: resolveLibraryStatusLabel(asset.analyzerStatus, t),
    showComposeAction: asset.analyzerStatus === "ready",
  }));
}
