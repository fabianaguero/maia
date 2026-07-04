import { useCallback } from "react";

import type {
  ImportBaseAssetInput,
  ImportCompositionInput,
  ImportRepositoryInput,
  ImportTrackInput,
} from "../types/library";
import {
  buildCatalogBaseAssetImportAction,
  buildCatalogCompositionImportAction,
  buildCatalogRepositoryImportAction,
  buildCatalogTrackImportAction,
  runCatalogImportAction,
} from "./appCatalogImportActionsRuntime";
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
  const handleImportTrack = useCallback(
    async (input: ImportTrackInput) =>
      runCatalogImportAction(
        buildCatalogTrackImportAction({
          library,
          importInput: input,
          t,
          notify,
          setNewlyImportedId,
          setAnalysisMode,
          setScreen,
        }),
      ),
    [library, notify, setAnalysisMode, setNewlyImportedId, setScreen, t],
  );

  const handleImportRepository = useCallback(
    async (input: ImportRepositoryInput) =>
      runCatalogImportAction(
        buildCatalogRepositoryImportAction({
          repositories,
          importInput: input,
          t,
          notify,
          setNewlyImportedId,
          setAnalysisMode,
          setScreen,
        }),
      ),
    [notify, repositories, setAnalysisMode, setNewlyImportedId, setScreen, t],
  );

  const handleImportBaseAsset = useCallback(
    async (input: ImportBaseAssetInput) =>
      runCatalogImportAction(
        buildCatalogBaseAssetImportAction({
          baseAssets,
          importInput: input,
          t,
          notify,
          setNewlyImportedId,
          setAnalysisMode,
          setScreen,
        }),
      ),
    [baseAssets, notify, setAnalysisMode, setNewlyImportedId, setScreen, t],
  );

  const handleImportComposition = useCallback(
    async (input: ImportCompositionInput) =>
      runCatalogImportAction(
        buildCatalogCompositionImportAction({
          compositions,
          importInput: input,
          t,
          notify,
          setNewlyImportedId,
          setAnalysisMode,
          setScreen,
        }),
      ),
    [compositions, notify, setAnalysisMode, setNewlyImportedId, setScreen, t],
  );

  return {
    handleImportTrack,
    handleImportRepository,
    handleImportBaseAsset,
    handleImportComposition,
  };
}
