import { buildAppCatalogActionsResult } from "./appCatalogActionsRuntime";
import { useAppCatalogImportActions } from "./useAppCatalogImportActions";
import { useAppCatalogLibraryActions } from "./useAppCatalogLibraryActions";
import type { UseAppCatalogActionsInput } from "./appCatalogActionsTypes";

export type { UseAppCatalogActionsInput } from "./appCatalogActionsTypes";

export function useAppCatalogActions(input: UseAppCatalogActionsInput) {
  const importActions = useAppCatalogImportActions(input);
  const libraryActions = useAppCatalogLibraryActions(input);

  return buildAppCatalogActionsResult({
    importActions,
    libraryActions,
  });
}
