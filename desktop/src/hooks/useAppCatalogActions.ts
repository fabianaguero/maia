import { useCallback } from "react";

import { discoverRepositoryLogs } from "../api/repositories";
import { buildDiscoveredLogImportInputs } from "../appRuntime";
import type { en } from "../i18n/en";
import type {
  BaseTrackPlaylist,
  ImportBaseAssetInput,
  ImportCompositionInput,
  ImportRepositoryInput,
  ImportTrackInput,
  LibraryTrack,
  RelinkMissingTracksResult,
  RepositoryAnalysis,
  SaveBaseTrackPlaylistInput,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../types/library";

type AppTranslations = typeof en;

interface UseAppCatalogActionsInput {
  t: AppTranslations;
  notify: (
    tone: "success" | "error" | "info",
    title: string,
    body: string,
  ) => void;
  setNewlyImportedId: (id: string | null) => void;
  setAnalysisMode: (mode: "track" | "repo" | "base") => void;
  setScreen: (screen: "inspect" | "compose") => void;
  library: {
    importLibraryTrack: (input: ImportTrackInput) => Promise<LibraryTrack | null>;
    reanalyzeTrack: (trackId: string) => Promise<LibraryTrack | null>;
    relinkTrack: (trackId: string) => Promise<LibraryTrack | null>;
    relinkMissingTracksFromDirectory: () => Promise<RelinkMissingTracksResult | null>;
    deleteLibraryTrack: (trackId: string) => Promise<boolean>;
    updateTrackPerformance: (
      trackId: string,
      input: UpdateTrackPerformanceInput,
    ) => Promise<LibraryTrack | null>;
    updateTrackAnalysis: (
      trackId: string,
      input: UpdateTrackAnalysisInput,
    ) => Promise<LibraryTrack | null>;
    savePlaylist: (input: SaveBaseTrackPlaylistInput) => Promise<BaseTrackPlaylist | null>;
    deletePlaylist: (playlistId: string) => Promise<boolean>;
  };
  repositories: {
    importRepositorySource: (input: ImportRepositoryInput) => Promise<RepositoryAnalysis | null>;
    reanalyzeRepository: (repositoryId: string) => Promise<RepositoryAnalysis | null>;
    deleteLibraryRepository: (repositoryId: string) => Promise<boolean>;
  };
  baseAssets: {
    importLibraryBaseAsset: (input: ImportBaseAssetInput) => Promise<{ id: string; title: string } | null>;
  };
  compositions: {
    importLibraryComposition: (
      input: ImportCompositionInput,
    ) => Promise<{ title: string } | null>;
  };
}

function flashImportedId(setNewlyImportedId: (id: string | null) => void, id: string) {
  setNewlyImportedId(id);
  window.setTimeout(() => setNewlyImportedId(null), 3000);
}

export function useAppCatalogActions({
  t,
  notify,
  setNewlyImportedId,
  setAnalysisMode,
  setScreen,
  library,
  repositories,
  baseAssets,
  compositions,
}: UseAppCatalogActionsInput) {
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
          flashImportedId(setNewlyImportedId, nextTrack.id);
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
          let msg = t.appShell.repositoryConnectedBody.replace("{title}", nextRepository.title);

          if (input.sourceKind === "directory") {
            const discovered = await discoverRepositoryLogs(input.sourcePath);
            if (discovered.length > 0) {
              for (const nextInput of buildDiscoveredLogImportInputs(discovered)) {
                void repositories.importRepositorySource(nextInput);
              }
              msg = t.appShell.repositoryConnectedRescuedBody
                .replace("{title}", nextRepository.title)
                .replace("{count}", String(discovered.length));
            }
          }

          notify("success", t.appShell.repositoryConnectedTitle, msg);
          flashImportedId(setNewlyImportedId, nextRepository.id);
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
          flashImportedId(setNewlyImportedId, nextBaseAsset.id);
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

  const handleReanalyzeTrack = useCallback(
    async (trackId: string) => {
      try {
        const nextTrack = await library.reanalyzeTrack(trackId);
        if (nextTrack) {
          notify(
            "success",
            t.appShell.reanalysisCompleteTitle,
            t.appShell.reanalysisCompleteBody.replace("{title}", nextTrack.tags.title),
          );
          return true;
        }
      } catch (err) {
        notify("error", t.appShell.reanalysisFailedTitle, String(err));
      }
      return false;
    },
    [library, notify, t],
  );

  const handleRelinkTrack = useCallback(
    async (trackId: string) => {
      try {
        const nextTrack = await library.relinkTrack(trackId);
        if (nextTrack) {
          notify(
            "success",
            t.appShell.trackRelinkedTitle,
            t.appShell.trackRelinkedBody.replace("{title}", nextTrack.tags.title),
          );
          return true;
        }
      } catch (err) {
        notify("error", t.appShell.relinkFailedTitle, String(err));
      }
      return false;
    },
    [library, notify, t],
  );

  const handleRelinkMissingTracks = useCallback(async () => {
    try {
      const result = await library.relinkMissingTracksFromDirectory();
      if (!result) {
        return false;
      }

      const relinkedCount = result.relinkedTracks.length;
      const unresolvedCount = result.unresolvedTrackIds.length;
      if (relinkedCount > 0) {
        notify(
          "success",
          t.appShell.missingTracksRelinkedTitle,
          unresolvedCount > 0
            ? t.appShell.missingTracksRelinkedPartialBody
                .replace("{resolved}", String(relinkedCount))
                .replace("{missing}", String(unresolvedCount))
            : t.appShell.missingTracksRelinkedSuccessBody.replace("{count}", String(relinkedCount)),
        );
      } else {
        notify("info", t.appShell.noMatchesFoundTitle, t.appShell.noMatchesFoundBody);
      }
      return true;
    } catch (err) {
      notify("error", t.appShell.bulkRelinkFailedTitle, String(err));
    }
    return false;
  }, [library, notify, t]);

  const handleReanalyzeRepository = useCallback(
    async (repositoryId: string) => {
      try {
        const nextRepository = await repositories.reanalyzeRepository(repositoryId);
        if (nextRepository) {
          notify(
            "success",
            t.appShell.reanalysisCompleteTitle,
            t.appShell.reanalysisCompleteBody.replace("{title}", nextRepository.title),
          );
          return true;
        }
      } catch (err) {
        notify("error", t.appShell.reanalysisFailedTitle, String(err));
      }
      return false;
    },
    [notify, repositories, t],
  );

  const handleDeleteTrack = useCallback(
    async (trackId: string) => {
      try {
        const success = await library.deleteLibraryTrack(trackId);
        if (success) {
          notify("success", t.appShell.trackDeletedTitle, t.appShell.trackDeletedBody);
          return true;
        }
      } catch (err) {
        notify("error", t.appShell.deleteFailedTitle, String(err));
      }
      return false;
    },
    [library, notify, t],
  );

  const handleDeleteRepository = useCallback(
    async (repositoryId: string) => {
      try {
        const success = await repositories.deleteLibraryRepository(repositoryId);
        if (success) {
          notify("success", t.appShell.repositoryDeletedTitle, t.appShell.repositoryDeletedBody);
          return true;
        }
      } catch (err) {
        notify("error", t.appShell.deleteFailedTitle, String(err));
      }
      return false;
    },
    [notify, repositories, t],
  );

  const handleUpdateTrackPerformance = useCallback(
    async (trackId: string, input: UpdateTrackPerformanceInput): Promise<void> => {
      try {
        const nextTrack = await library.updateTrackPerformance(trackId, input);
        if (!nextTrack) {
          notify("error", t.appShell.trackUpdateFailedTitle, t.appShell.trackUpdateFailedBody);
        }
      } catch (err) {
        notify("error", t.appShell.trackUpdateFailedTitle, String(err));
      }
    },
    [library, notify, t],
  );

  const handleUpdateTrackAnalysis = useCallback(
    async (trackId: string, input: UpdateTrackAnalysisInput): Promise<void> => {
      try {
        const nextTrack = await library.updateTrackAnalysis(trackId, input);
        if (!nextTrack) {
          notify(
            "error",
            t.appShell.beatGridUpdateFailedTitle,
            t.appShell.beatGridUpdateFailedBody,
          );
        }
      } catch (err) {
        notify("error", t.appShell.beatGridUpdateFailedTitle, String(err));
      }
    },
    [library, notify, t],
  );

  const handleSavePlaylist = useCallback(
    async (input: SaveBaseTrackPlaylistInput): Promise<boolean> => {
      try {
        const nextPlaylist = await library.savePlaylist(input);
        if (nextPlaylist) {
          notify(
            "success",
            t.appShell.playlistSavedTitle,
            t.appShell.playlistSavedBody.replace("{name}", nextPlaylist.name),
          );
          return true;
        }
      } catch (err) {
        notify("error", t.appShell.playlistSaveFailedTitle, String(err));
      }
      return false;
    },
    [library, notify, t],
  );

  const handleDeletePlaylist = useCallback(
    async (playlistId: string): Promise<boolean> => {
      try {
        const success = await library.deletePlaylist(playlistId);
        if (success) {
          notify("success", t.appShell.playlistDeletedTitle, t.appShell.playlistDeletedBody);
          return true;
        }
      } catch (err) {
        notify("error", t.appShell.playlistDeleteFailedTitle, String(err));
      }
      return false;
    },
    [library, notify, t],
  );

  return {
    handleImportTrack,
    handleImportRepository,
    handleImportBaseAsset,
    handleImportComposition,
    handleReanalyzeTrack,
    handleRelinkTrack,
    handleRelinkMissingTracks,
    handleReanalyzeRepository,
    handleDeleteTrack,
    handleDeleteRepository,
    handleUpdateTrackPerformance,
    handleUpdateTrackAnalysis,
    handleSavePlaylist,
    handleDeletePlaylist,
  };
}
