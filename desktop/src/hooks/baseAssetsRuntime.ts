import type { BaseAssetRecord } from "../types/library";

export function toBaseAssetErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Unexpected base asset failure.";
}

export function sortBaseAssetsByImportedAt(baseAssets: BaseAssetRecord[]): BaseAssetRecord[] {
  return [...baseAssets].sort((left, right) => right.importedAt.localeCompare(left.importedAt));
}

export function resolveSelectedBaseAssetId(
  current: string | null,
  baseAssets: BaseAssetRecord[],
): string | null {
  if (current && baseAssets.some((baseAsset) => baseAsset.id === current)) {
    return current;
  }

  return baseAssets[0]?.id ?? null;
}

export function appendImportedBaseAsset(
  baseAssets: BaseAssetRecord[],
  nextBaseAsset: BaseAssetRecord,
): BaseAssetRecord[] {
  return sortBaseAssetsByImportedAt([
    nextBaseAsset,
    ...baseAssets.filter((baseAsset) => baseAsset.id !== nextBaseAsset.id),
  ]);
}
