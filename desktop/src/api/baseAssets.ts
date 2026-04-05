import { invoke } from "@tauri-apps/api/core";

import type {
  BaseAssetRecord,
  BaseAssetSourceKind,
  ImportBaseAssetInput,
} from "../types/library";
import {
  importMockBaseAsset,
  listMockBaseAssets,
} from "./mockBaseAssets";

function isNativeBridgeUnavailable(error: unknown): boolean {
  return (
    error instanceof Error &&
    /tauri|__TAURI_INTERNALS__|ipc|native bridge/i.test(error.message)
  );
}

export async function listBaseAssets(): Promise<BaseAssetRecord[]> {
  try {
    return await invoke<BaseAssetRecord[]>("list_base_assets");
  } catch {
    return listMockBaseAssets();
  }
}

export async function importBaseAsset(
  input: ImportBaseAssetInput,
): Promise<BaseAssetRecord> {
  try {
    return await invoke<BaseAssetRecord>("import_base_asset", { input });
  } catch {
    return importMockBaseAsset(input);
  }
}

export async function pickBaseAssetPath(
  sourceKind: BaseAssetSourceKind,
  initialPath?: string,
): Promise<string | null> {
  try {
    return await invoke<string | null>("pick_base_asset_path", {
      sourceKind,
      initialPath: initialPath?.trim() || undefined,
    });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return null;
    }

    throw error;
  }
}
