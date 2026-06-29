import type { CompositionResultRecord } from "../types/library";

export function toCompositionErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Unexpected composition failure.";
}

export function sortCompositionsByImportedAt(
  compositions: CompositionResultRecord[],
): CompositionResultRecord[] {
  return [...compositions].sort((left, right) => right.importedAt.localeCompare(left.importedAt));
}

export function resolveSelectedCompositionId(
  current: string | null,
  compositions: CompositionResultRecord[],
): string | null {
  if (current && compositions.some((composition) => composition.id === current)) {
    return current;
  }

  return compositions[0]?.id ?? null;
}

export function appendImportedComposition(
  compositions: CompositionResultRecord[],
  nextComposition: CompositionResultRecord,
): CompositionResultRecord[] {
  return sortCompositionsByImportedAt([
    nextComposition,
    ...compositions.filter((composition) => composition.id !== nextComposition.id),
  ]);
}
