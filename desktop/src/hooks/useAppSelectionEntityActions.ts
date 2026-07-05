import { useMemo } from "react";

import type { UseAppSelectionActionsInput } from "./appSelectionActionsTypes";
import { buildAppSelectionEntityActionRunners } from "./appSelectionActionsRuntime";

type EntityActionsInput = Pick<
  UseAppSelectionActionsInput,
  | "armPlaylistBase"
  | "armTrackBase"
  | "library"
  | "repositories"
  | "baseAssets"
  | "compositions"
  | "setAnalysisMode"
  | "setScreen"
>;

export function useAppSelectionEntityActions({
  armPlaylistBase,
  armTrackBase,
  library,
  repositories,
  baseAssets,
  compositions,
  setAnalysisMode,
  setScreen,
}: EntityActionsInput) {
  return useMemo(
    () =>
      buildAppSelectionEntityActionRunners({
        armPlaylistBase,
        armTrackBase,
        library,
        repositories,
        baseAssets,
        compositions,
        setAnalysisMode,
        setScreen,
      }),
    [
      armPlaylistBase,
      armTrackBase,
      baseAssets,
      compositions,
      library,
      repositories,
      setAnalysisMode,
      setScreen,
    ],
  );
}
