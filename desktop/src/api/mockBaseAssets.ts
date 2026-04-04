import {
  fallbackBaseAssetCategoryLabel,
  resolveBaseAssetCategory,
} from "../config/baseAssetCategories";
import type {
  BaseAssetRecord,
  ImportBaseAssetInput,
} from "../types/library";

const STORAGE_KEY = "maia.library.base-assets.v1";
let memoryStore: BaseAssetRecord[] = [];

function readBaseAssets(): BaseAssetRecord[] {
  if (typeof window === "undefined") {
    return memoryStore;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as BaseAssetRecord[];
  } catch {
    return [];
  }
}

function writeBaseAssets(baseAssets: BaseAssetRecord[]): void {
  if (typeof window === "undefined") {
    memoryStore = baseAssets;
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(baseAssets));
}

function stableHash(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function toChecksum(seed: number): string {
  return Array.from({ length: 4 }, (_, index) =>
    ((seed >> (index * 8)) & 0xff).toString(16).padStart(2, "0"),
  ).join("");
}

function deriveTitle(sourcePath: string): string {
  const tail = sourcePath.trim().split(/[\\/]/).pop() ?? "base-asset";
  return tail || "base-asset";
}

function createBaseAsset(input: ImportBaseAssetInput): BaseAssetRecord {
  const sourcePath = input.sourcePath.trim();
  const category = resolveBaseAssetCategory(input.categoryId);
  const categoryId = category?.id ?? input.categoryId;
  const categoryLabel = category?.label ?? fallbackBaseAssetCategoryLabel(categoryId);
  const title = input.label?.trim() || deriveTitle(sourcePath);
  const seed = stableHash(
    `${input.sourceKind}:${sourcePath}:${categoryId}:${input.reusable}:${title}`,
  );
  const entryCount = input.sourceKind === "directory" ? 6 + (seed % 24) : 1;
  const totalSizeBytes =
    input.sourceKind === "directory" ? 100_000 + (seed % 700_000) : 10_000 + (seed % 90_000);

  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `base-${Date.now()}-${seed}`,
    title,
    sourcePath,
    storagePath: sourcePath,
    sourceKind: input.sourceKind,
    importedAt: new Date().toISOString(),
    categoryId,
    categoryLabel,
    reusable: input.reusable,
    entryCount,
    checksum: toChecksum(seed),
    confidence: Number((0.61 + (seed % 18) / 100).toFixed(2)),
    summary:
      input.sourceKind === "directory"
        ? `${title} registered as a reusable base collection.`
        : `${title} registered as a reusable base file.`,
    analyzerStatus:
      input.sourceKind === "directory"
        ? "Base collection analyzed"
        : "Base file analyzed",
    notes: [
      "Browser fallback is active because Tauri is unavailable.",
      `Registered under ${categoryLabel} category.`,
      input.reusable
        ? "Marked as reusable for future composition workflows."
        : "Marked as reference-only for cataloging without reuse.",
      "MVP stores base assets by source-path reference instead of copying files into managed storage.",
    ],
    tags: [
      "base-asset",
      categoryId,
      input.sourceKind,
      input.reusable ? "reusable" : "reference-only",
      `category:${categoryId}`,
    ],
    metrics: {
      category: categoryId,
      sourceKind: input.sourceKind,
      entryCount,
      checksum: toChecksum(seed),
      totalSizeBytes,
      reusable: input.reusable,
    },
  };
}

export async function listMockBaseAssets(): Promise<BaseAssetRecord[]> {
  return readBaseAssets().sort((left, right) =>
    right.importedAt.localeCompare(left.importedAt),
  );
}

export async function importMockBaseAsset(
  input: ImportBaseAssetInput,
): Promise<BaseAssetRecord> {
  const nextBaseAsset = createBaseAsset(input);
  const nextBaseAssets = [nextBaseAsset, ...readBaseAssets()];
  writeBaseAssets(nextBaseAssets);
  return nextBaseAsset;
}
