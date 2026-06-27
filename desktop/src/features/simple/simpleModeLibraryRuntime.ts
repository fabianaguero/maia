import type { ImportRepositoryInput } from "../../types/library";

export function resolveSimpleModeRepositorySourceKind(path: string): "file" | "directory" {
  return path.includes(".") ? "file" : "directory";
}

export function buildSimpleModeImportRepositoryInput(
  path: string,
  fallbackLabel: string,
): ImportRepositoryInput {
  return {
    label: path.split("/").pop() || fallbackLabel,
    sourcePath: path,
    sourceKind: resolveSimpleModeRepositorySourceKind(path),
  };
}

export function shouldShowSimpleModeStartButton(
  repositoryId: string,
  selectedRepositoryId: string | null,
  baseAssetCount: number,
): boolean {
  return repositoryId === selectedRepositoryId && baseAssetCount > 0;
}
