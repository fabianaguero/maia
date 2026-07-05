import { useMemo } from "react";

import { buildCatalogImportActionRunners } from "./appCatalogImportActionsRuntime";
import type { UseAppCatalogActionsInput } from "./appCatalogActionsTypes";

type CatalogImportActionsInput = Pick<
  UseAppCatalogActionsInput,
  | "t"
  | "notify"
  | "setNewlyImportedId"
  | "setAnalysisMode"
  | "setScreen"
  | "library"
  | "repositories"
  | "baseAssets"
  | "compositions"
>;

export function useAppCatalogImportActions({
  t,
  notify,
  setNewlyImportedId,
  setAnalysisMode,
  setScreen,
  library,
  repositories,
  baseAssets,
  compositions,
}: CatalogImportActionsInput) {
  return useMemo(
    () =>
      buildCatalogImportActionRunners({
        t,
        notify,
        setNewlyImportedId,
        setAnalysisMode,
        setScreen,
        library,
        repositories,
        baseAssets,
        compositions,
      }),
    [
      baseAssets,
      compositions,
      library,
      notify,
      repositories,
      setAnalysisMode,
      setNewlyImportedId,
      setScreen,
      t,
    ],
  );
}
