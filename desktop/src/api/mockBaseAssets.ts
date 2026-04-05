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

function playableEntriesForCategory(
  categoryId: string,
  sourceKind: ImportBaseAssetInput["sourceKind"],
): string[] {
  if (sourceKind === "file") {
    return [];
  }

  switch (categoryId) {
    case "drum-kit":
      return ["kick.wav", "hat.wav", "snare.wav", "perc-loop.wav"];
    case "bass-motif":
      return ["bass-root.wav", "bass-octave.wav", "bass-accent.wav"];
    case "pad-texture":
      return ["pad-bed.wav", "pad-rise.wav", "pad-shimmer.wav"];
    case "fx-palette":
      return ["rise.wav", "impact.wav", "glitch.wav", "reverse.wav"];
    case "vocal-hook":
      return ["hook-main.wav", "hook-adlib.wav", "hook-stab.wav"];
    case "code-pattern":
      return ["pattern-low.wav", "pattern-mid.wav", "pattern-high.wav"];
    default:
      return ["layer-a.wav", "layer-b.wav", "layer-c.wav"];
  }
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
  const storagePath = `browser-fallback://base-assets/${seed.toString(16)}/${title}`;
  const playableAudioEntries =
    input.sourceKind === "file" &&
    /\.(wav|mp3|flac|ogg|oga|aif|aiff)$/i.test(sourcePath)
      ? [title]
      : playableEntriesForCategory(categoryId, input.sourceKind);
  const previewEntries =
    input.sourceKind === "directory"
      ? [...playableAudioEntries, "notes.txt", "pattern.json"].slice(0, 6)
      : [title];

  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `base-${Date.now()}-${seed}`,
    title,
    sourcePath,
    storagePath,
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
      "The browser fallback preserves the same base-asset shape, but it cannot create a native managed snapshot on disk.",
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
      extensionBreakdown:
        input.sourceKind === "directory"
          ? { wav: playableAudioEntries.length, txt: 1, json: 1 }
          : { [sourcePath.split(".").pop()?.toLowerCase() || "file"]: 1 },
      previewEntries,
      audioEntryCount: playableAudioEntries.length,
      playableAudioEntries,
      storageMode: "browser-fallback",
      originalSourcePath: sourcePath,
      storagePath,
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
