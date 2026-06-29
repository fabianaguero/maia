import { useCallback } from "react";

import { discoverRepositoryLogs } from "../api/repositories";
import { buildDiscoveredLogImportInputs } from "../appRuntime";
import type {
  ImportBaseAssetInput,
  ImportCompositionInput,
  ImportRepositoryInput,
  ImportTrackInput,
} from "../types/library";
import {
  buildRepositoryImportSuccessMessage,
  scheduleImportedHighlightReset,
} from "./appCatalogActionsRuntime";
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
    async (input: ImportTrackInput) => {
      try {
        const nextTrack = await library.importLibraryTrack(input);
        if (nextTrack) {
          notify(
            "success",
            t.appShell.trackImportedTitle,
            t.appShell.trackImportedBody.replace("{title}", nextTrack.tags.title),
          );
          scheduleImportedHighlightReset({
            id: nextTrack.id,
            setNewlyImportedId,
          });
          setAnalysisMode("track");
          setScreen("inspect");
          return true;
        }
      } catch (err) {
        notify("error", t.appShell.importFailedTitle, String(err));
      }
      return false;
    },
    [library, notify, setAnalysisMode, setNewlyImportedId, setScreen, t],
  );

  const handleImportRepository = useCallback(
    async (input: ImportRepositoryInput) => {
      try {
        const nextRepository = await repositories.importRepositorySource(input);
        if (nextRepository) {
          let rescuedLogCount = 0;

          if (input.sourceKind === "directory") {
            const discovered = await discoverRepositoryLogs(input.sourcePath);
            rescuedLogCount = discovered.length;
            for (const nextInput of buildDiscoveredLogImportInputs(discovered)) {
              void repositories.importRepositorySource(nextInput);
            }
          }

          notify(
            "success",
            t.appShell.repositoryConnectedTitle,
            buildRepositoryImportSuccessMessage({
              t,
              title: nextRepository.title,
              rescuedLogCount,
            }),
          );
          scheduleImportedHighlightReset({
            id: nextRepository.id,
            setNewlyImportedId,
          });
          setAnalysisMode("repo");
          setScreen("inspect");
          return true;
        }
      } catch (err) {
        notify("error", t.appShell.connectionFailedTitle, String(err));
      }
      return false;
    },
    [notify, repositories, setAnalysisMode, setNewlyImportedId, setScreen, t],
  );

  const handleImportBaseAsset = useCallback(
    async (input: ImportBaseAssetInput) => {
      try {
        const nextBaseAsset = await baseAssets.importLibraryBaseAsset(input);
        if (nextBaseAsset) {
          notify(
            "success",
            t.appShell.assetImportedTitle,
            t.appShell.assetImportedBody.replace("{title}", nextBaseAsset.title),
          );
          scheduleImportedHighlightReset({
            id: nextBaseAsset.id,
            setNewlyImportedId,
          });
          setAnalysisMode("base");
          setScreen("inspect");
          return true;
        }
      } catch (err) {
        notify("error", t.appShell.assetImportFailedTitle, String(err));
      }
      return false;
    },
    [baseAssets, notify, setAnalysisMode, setNewlyImportedId, setScreen, t],
  );

  const handleImportComposition = useCallback(
    async (input: ImportCompositionInput) => {
      try {
        const nextComposition = await compositions.importLibraryComposition(input);
        if (nextComposition) {
          notify(
            "success",
            t.appShell.compositionReadyTitle,
            t.appShell.compositionReadyBody.replace("{title}", nextComposition.title),
          );
          return true;
        }
      } catch (err) {
        notify("error", t.appShell.compositionFailedTitle, String(err));
      }
      return false;
    },
    [compositions, notify, t],
  );

  return {
    handleImportTrack,
    handleImportRepository,
    handleImportBaseAsset,
    handleImportComposition,
  };
}
