import { useMemo } from "react";

import {
  buildCatalogLibraryActionRunners,
} from "./appCatalogLibraryActionsRuntime";
import type { UseAppCatalogActionsInput } from "./appCatalogActionsTypes";

type CatalogLibraryActionsInput = Pick<
  UseAppCatalogActionsInput,
  "t" | "notify" | "library" | "repositories"
>;

export function useAppCatalogLibraryActions({
  t,
  notify,
  library,
  repositories,
}: CatalogLibraryActionsInput) {
  return useMemo(
    () =>
      buildCatalogLibraryActionRunners({
        t,
        notify,
        library,
        repositories,
      }),
    [library, notify, repositories, t],
  );
}
