import { useCallback, type Dispatch, type SetStateAction } from "react";

import { deleteLogSourceConnection } from "../../api/repositories";
import type { LibraryScreenControllerInput } from "./libraryScreenControllerTypes";

interface LibraryScreenImportActionsInput {
  onImportTrack: LibraryScreenControllerInput["onImportTrack"];
  onImportRepository: LibraryScreenControllerInput["onImportRepository"];
  onImportBaseAsset: LibraryScreenControllerInput["onImportBaseAsset"];
  refreshLogConnections: () => Promise<void>;
  setShowForm: Dispatch<SetStateAction<boolean>>;
  setLogConnectionError: Dispatch<SetStateAction<string | null>>;
}

export function useLibraryScreenImportActions({
  onImportTrack,
  onImportRepository,
  onImportBaseAsset,
  refreshLogConnections,
  setShowForm,
  setLogConnectionError,
}: LibraryScreenImportActionsInput) {
  const handleImportTrack = useCallback(
    async (input: Parameters<typeof onImportTrack>[0]) => {
      const ok = await onImportTrack(input);
      if (ok) {
        setShowForm(false);
      }
      return ok;
    },
    [onImportTrack, setShowForm],
  );

  const handleImportRepository = useCallback(
    async (input: Parameters<typeof onImportRepository>[0]) => {
      const ok = await onImportRepository(input);
      if (ok) {
        if (input.sourceKind === "file") {
          void refreshLogConnections();
        }
        setShowForm(false);
      }
      return ok;
    },
    [onImportRepository, refreshLogConnections, setShowForm],
  );

  const handleImportBaseAsset = useCallback(
    async (input: Parameters<typeof onImportBaseAsset>[0]) => {
      const ok = await onImportBaseAsset(input);
      if (ok) {
        setShowForm(false);
      }
      return ok;
    },
    [onImportBaseAsset, setShowForm],
  );

  const handleDeleteLogConnection = useCallback(
    async (connectionId: string): Promise<void> => {
      try {
        await deleteLogSourceConnection(connectionId);
        await refreshLogConnections();
      } catch (error) {
        setLogConnectionError(error instanceof Error ? error.message : String(error));
      }
    },
    [refreshLogConnections, setLogConnectionError],
  );

  return {
    handleImportTrack,
    handleImportRepository,
    handleImportBaseAsset,
    handleDeleteLogConnection,
  };
}
