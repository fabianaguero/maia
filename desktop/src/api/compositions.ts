import { invoke } from "@tauri-apps/api/core";

import type {
  CompositionResultRecord,
  ImportCompositionInput,
} from "../types/library";
import {
  importMockCompositionResult,
  listMockCompositionResults,
} from "./mockCompositionResults";

export async function listCompositions(): Promise<CompositionResultRecord[]> {
  try {
    return await invoke<CompositionResultRecord[]>("list_compositions");
  } catch {
    return listMockCompositionResults();
  }
}

export async function importComposition(
  input: ImportCompositionInput,
): Promise<CompositionResultRecord> {
  try {
    return await invoke<CompositionResultRecord>("import_composition", { input });
  } catch {
    return importMockCompositionResult(input);
  }
}
