import { useCallback } from "react";

import type {
  SaveBaseTrackPlaylistInput,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../types/library";
import { buildRelinkMissingTracksNotice } from "./appCatalogActionsRuntime";
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

      const notice = buildRelinkMissingTracksNotice({ t, result });
      notify(notice.tone, notice.title, notice.body);
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
