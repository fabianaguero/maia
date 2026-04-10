import type {
  CompositionResultRecord,
  ImportCompositionInput,
} from "../types/library";
import { invokeOrFallback } from "./tauri";
import {
  importMockCompositionResult,
  listMockCompositionResults,
} from "./mockCompositionResults";

export async function listCompositions(): Promise<CompositionResultRecord[]> {
  return invokeOrFallback(
    "list_compositions",
    undefined,
    () => listMockCompositionResults(),
  );
}

export async function importComposition(
  input: ImportCompositionInput,
): Promise<CompositionResultRecord> {
  return invokeOrFallback(
    "import_composition",
    { input },
    () => importMockCompositionResult(input),
  );
}
