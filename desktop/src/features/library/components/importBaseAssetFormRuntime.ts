import type { AppTranslations } from "../../../i18n/types";
import type { BaseAssetCategoryOption } from "../../../types/baseAsset";
import type { BaseAssetSourceKind, ImportBaseAssetInput } from "../../../types/library";

export interface BaseAssetSourceModeOption {
  id: BaseAssetSourceKind;
  label: string;
  help: string;
}

export function deriveImportBaseAssetLabel(sourcePath: string, fallbackLabel: string): string {
  return sourcePath.trim().split(/[\\/]/).pop() ?? fallbackLabel;
}

export function resolveImportBaseAssetSourceModes(t: AppTranslations): BaseAssetSourceModeOption[] {
  return [
    {
      id: "file",
      label: t.library.forms.baseAsset.singleFile,
      help: t.library.forms.baseAsset.singleFileHelp,
    },
    {
      id: "directory",
      label: t.library.forms.baseAsset.folderPack,
      help: t.library.forms.baseAsset.folderPackHelp,
    },
  ];
}

export function resolveImportBaseAssetFallbackCategoryId(
  categories: BaseAssetCategoryOption[],
  defaultCategoryId?: string,
): string {
  return defaultCategoryId ?? categories[0]?.id ?? "";
}

export function resolveValidImportBaseAssetCategoryId(input: {
  categoryId: string;
  categories: BaseAssetCategoryOption[];
  defaultCategoryId?: string;
}): string {
  if (input.categories.some((category) => category.id === input.categoryId)) {
    return input.categoryId;
  }

  return resolveImportBaseAssetFallbackCategoryId(input.categories, input.defaultCategoryId);
}

export function validateImportBaseAssetForm(input: {
  sourcePath: string;
  categoryId: string;
  t: AppTranslations;
}): string | null {
  if (!input.sourcePath.trim()) {
    return input.t.library.forms.baseAsset.pathRequiredError;
  }

  if (!input.categoryId.trim()) {
    return input.t.library.forms.baseAsset.categoryRequiredError;
  }

  return null;
}

export function buildImportBaseAssetPayload(input: {
  sourceKind: BaseAssetSourceKind;
  sourcePath: string;
  label: string;
  categoryId: string;
  reusable: boolean;
  fallbackLabel: string;
}): ImportBaseAssetInput {
  const normalizedPath = input.sourcePath.trim();

  return {
    sourceKind: input.sourceKind,
    sourcePath: normalizedPath,
    label: input.label.trim() || deriveImportBaseAssetLabel(normalizedPath, input.fallbackLabel),
    categoryId: input.categoryId.trim(),
    reusable: input.reusable,
  };
}

export function buildImportBaseAssetResetState(fallbackCategoryId: string) {
  return {
    sourcePath: "",
    label: "",
    reusable: true,
    categoryId: fallbackCategoryId,
  };
}

export function normalizeImportBaseAssetPickerLabel(input: {
  currentLabel: string;
  pickedPath: string;
  fallbackLabel: string;
}): string {
  return (
    input.currentLabel.trim() || deriveImportBaseAssetLabel(input.pickedPath, input.fallbackLabel)
  );
}

export function formatImportBaseAssetPickerError(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}
