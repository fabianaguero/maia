import { invoke } from "@tauri-apps/api/core";

import type {
  CompositionResultRecord,
  ImportCompositionInput,
} from "../types/library";
import {
  importMockCompositionResult,
  listMockCompositionResults,
} from "./mockCompositionResults";

function isNativeBridgeUnavailable(error: unknown): boolean {
  return (
    error instanceof Error &&
    /tauri|__TAURI_INTERNALS__|ipc|native bridge/i.test(error.message)
  );
}

export async function listCompositions(): Promise<CompositionResultRecord[]> {
  try {
    return await invoke<CompositionResultRecord[]>("list_compositions");
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return listMockCompositionResults();
    }
    throw error;
  }
}

export async function importComposition(
  input: ImportCompositionInput,
): Promise<CompositionResultRecord> {
  try {
    return await invoke<CompositionResultRecord>("import_composition", { input });
  } catch (error) {
    if (isNativeBridgeUnavailable(error)) {
      return importMockCompositionResult(input);
    }
    throw error;
  }
}
