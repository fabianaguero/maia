import type { Dispatch, SetStateAction } from "react";

import type { ConnectionDraft } from "./connectionsViewModel";

export async function browseConnectionFileState(input: {
  sourcePath: string;
  setPickerBusy: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setDraft: Dispatch<SetStateAction<ConnectionDraft>>;
  pickRepositoryFile: (currentPath?: string) => Promise<string | null>;
  fallbackErrorMessage: string;
}): Promise<void> {
  try {
    input.setPickerBusy(true);
    input.setError(null);
    const pickedPath = await input.pickRepositoryFile(input.sourcePath);
    if (pickedPath) {
      input.setDraft((current) => ({ ...current, sourcePath: pickedPath }));
    }
  } catch (error) {
    input.setError(error instanceof Error ? error.message : input.fallbackErrorMessage);
  } finally {
    input.setPickerBusy(false);
  }
}
