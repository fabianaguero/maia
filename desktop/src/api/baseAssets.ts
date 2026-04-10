import type {
  BaseAssetRecord,
  BaseAssetSourceKind,
  ImportBaseAssetInput,
} from "../types/library";
import { invokeOrFallback } from "./tauri";
import {
  importMockBaseAsset,
  listMockBaseAssets,
} from "./mockBaseAssets";

export async function listBaseAssets(): Promise<BaseAssetRecord[]> {
  return invokeOrFallback("list_base_assets", undefined, () => listMockBaseAssets());
}

export async function importBaseAsset(
  input: ImportBaseAssetInput,
): Promise<BaseAssetRecord> {
  return invokeOrFallback(
    "import_base_asset",
    { input },
    () => importMockBaseAsset(input),
  );
}

export async function pickBaseAssetPath(
  sourceKind: BaseAssetSourceKind,
  initialPath?: string,
): Promise<string | null> {
  return invokeOrFallback(
    "pick_base_asset_path",
    {
      sourceKind,
      initialPath: initialPath?.trim() || undefined,
    },
    () => null,
  );
}
