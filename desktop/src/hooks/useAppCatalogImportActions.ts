import { useCallback } from "react";

import type {
  ImportBaseAssetInput,
  ImportCompositionInput,
  ImportRepositoryInput,
  ImportTrackInput,
} from "../types/library";
import {
  applyCatalogImportSuccess,
  buildBaseAssetImportNotice,
  buildCatalogImportNavigation,
  buildCompositionImportNotice,
  buildRepositoryImportNotice,
  buildTrackImportNotice,
  resolveRepositoryImportRescue,
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
      runCatalogImportAction({
        task: () => library.importLibraryTrack(input),
        onSuccess: (nextTrack) => {
          applyCatalogImportSuccess({
            id: nextTrack.id,
            notice: buildTrackImportNotice(t, nextTrack.tags.title),
            notify,
            setNewlyImportedId,
            navigation: buildCatalogImportNavigation("track"),
            setAnalysisMode,
            setScreen,
          });
        },
        onError: (err) => ({
          tone: "error",
          title: t.appShell.importFailedTitle,
          body: String(err),
        }),
        notify,
      }),
    [library, notify, setAnalysisMode, setNewlyImportedId, setScreen, t],
  );

  const handleImportRepository = useCallback(
    async (input: ImportRepositoryInput) =>
      runCatalogImportAction({
        task: () => repositories.importRepositorySource(input),
        onSuccess: async (nextRepository) => {
          const rescuedLogCount = await resolveRepositoryImportRescue({
            sourceKind: input.sourceKind,
            sourcePath: input.sourcePath,
            importRepositorySource: repositories.importRepositorySource,
          });
          applyCatalogImportSuccess({
            id: nextRepository.id,
            notice: buildRepositoryImportNotice({
              t,
              title: nextRepository.title,
              rescuedLogCount,
            }),
            notify,
            setNewlyImportedId,
            navigation: buildCatalogImportNavigation("repo"),
            setAnalysisMode,
            setScreen,
          });
        },
        onError: (err) => ({
          tone: "error",
          title: t.appShell.connectionFailedTitle,
          body: String(err),
        }),
        notify,
      }),
    [notify, repositories, setAnalysisMode, setNewlyImportedId, setScreen, t],
  );

  const handleImportBaseAsset = useCallback(
    async (input: ImportBaseAssetInput) =>
      runCatalogImportAction({
        task: () => baseAssets.importLibraryBaseAsset(input),
        onSuccess: (nextBaseAsset) => {
          applyCatalogImportSuccess({
            id: nextBaseAsset.id,
            notice: buildBaseAssetImportNotice(t, nextBaseAsset.title),
            notify,
            setNewlyImportedId,
            navigation: buildCatalogImportNavigation("base"),
            setAnalysisMode,
            setScreen,
          });
        },
        onError: (err) => ({
          tone: "error",
          title: t.appShell.assetImportFailedTitle,
          body: String(err),
        }),
        notify,
      }),
    [baseAssets, notify, setAnalysisMode, setNewlyImportedId, setScreen, t],
  );

  const handleImportComposition = useCallback(
    async (input: ImportCompositionInput) =>
      runCatalogImportAction({
        task: () => compositions.importLibraryComposition(input),
        onSuccess: (nextComposition) => {
          applyCatalogImportSuccess({
            notice: buildCompositionImportNotice(t, nextComposition.title),
            notify,
            setNewlyImportedId,
            setAnalysisMode,
            setScreen,
          });
        },
        onError: (err) => ({
          tone: "error",
          title: t.appShell.compositionFailedTitle,
          body: String(err),
        }),
        notify,
      }),
    [compositions, notify, setAnalysisMode, setNewlyImportedId, setScreen, t],
  );

  return {
    handleImportTrack,
    handleImportRepository,
    handleImportBaseAsset,
    handleImportComposition,
  };
}
