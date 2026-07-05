import { useMemo } from "react";

import type { UseAppSelectionActionsInput } from "./appSelectionActionsTypes";
import {
  buildAppSelectionMonitorActionRunners,
} from "./appSelectionActionsRuntime";

type MonitorActionsInput = Pick<
  UseAppSelectionActionsInput,
  "library" | "repositories" | "baseAssets" | "setPillar" | "setScreen"
>;

export function useAppSelectionMonitorActions({
  library,
  repositories,
  baseAssets,
  setPillar,
  setScreen,
}: MonitorActionsInput) {
  return useMemo(
    () =>
      buildAppSelectionMonitorActionRunners({
        library,
        repositories,
        baseAssets,
        setPillar,
        setScreen,
      }),
    [baseAssets, library, repositories, setPillar, setScreen],
  );
}
