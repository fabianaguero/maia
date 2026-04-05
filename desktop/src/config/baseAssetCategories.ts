import rawCatalog from "./base-asset-categories.json";

import type {
  BaseAssetCategoryCatalog,
  BaseAssetCategoryOption,
} from "../types/baseAsset";

const fallbackCatalog: BaseAssetCategoryCatalog = {
  defaultBaseAssetCategoryId: "collection",
  baseAssetCategories: [
    {
      id: "collection",
      label: "Collection",
      description: "Folder-level reusable pack that groups related source material.",
    },
    {
      id: "drum-kit",
      label: "Drum Kit",
      description: "One-shots, loops, and percussion building blocks for rhythm layers.",
    },
    {
      id: "code-pattern",
      label: "Code Pattern",
      description: "Reusable repo/log-derived rhythm motif or structural pattern.",
    },
  ],
};

function normalizeCategory(
  category: Partial<BaseAssetCategoryOption>,
): BaseAssetCategoryOption | null {
  const id = typeof category.id === "string" ? category.id.trim() : "";
  const label = typeof category.label === "string" ? category.label.trim() : "";
  const description =
    typeof category.description === "string" ? category.description.trim() : "";

  if (!id || !label || !description) {
    return null;
  }

  return { id, label, description };
}

function normalizeCatalog(
  input: Partial<BaseAssetCategoryCatalog>,
): BaseAssetCategoryCatalog {
  const baseAssetCategories = Array.isArray(input.baseAssetCategories)
    ? input.baseAssetCategories
        .map((category) => normalizeCategory(category))
        .filter(
          (category): category is BaseAssetCategoryOption => category !== null,
        )
    : [];

  if (baseAssetCategories.length === 0) {
    return fallbackCatalog;
  }

  const preferredDefaultId =
    typeof input.defaultBaseAssetCategoryId === "string"
      ? input.defaultBaseAssetCategoryId.trim()
      : "";
  const defaultBaseAssetCategoryId = baseAssetCategories.some(
    (category) => category.id === preferredDefaultId,
  )
    ? preferredDefaultId
    : baseAssetCategories[0].id;

  return {
    defaultBaseAssetCategoryId,
    baseAssetCategories,
  };
}

export const baseAssetCategoryCatalog = normalizeCatalog(rawCatalog);

export function resolveBaseAssetCategory(
  id: string | null | undefined,
): BaseAssetCategoryOption | null {
  if (!id) {
    return null;
  }

  return (
    baseAssetCategoryCatalog.baseAssetCategories.find(
      (category) => category.id === id,
    ) ?? null
  );
}

export function fallbackBaseAssetCategoryLabel(
  id: string | null | undefined,
): string {
  const resolved = resolveBaseAssetCategory(id);
  if (resolved) {
    return resolved.label;
  }

  return id?.trim() ? id : "Not set";
}
