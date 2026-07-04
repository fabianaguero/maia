import { useCallback } from "react";

import type {
  SaveBaseTrackPlaylistInput,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../types/library";
import {
  runCatalogBooleanAction,
  runCatalogResultAction,
  runCatalogUpdateAction,
  buildCatalogPlaylistDeleteAction,
  buildCatalogPlaylistSaveAction,
  buildCatalogRelinkMissingTracksAction,
  buildCatalogRepositoryDeleteAction,
  buildCatalogRepositoryReanalyzeAction,
  buildCatalogTrackAnalysisUpdateAction,
  buildCatalogTrackDeleteAction,
  buildCatalogTrackPerformanceUpdateAction,
  buildCatalogTrackReanalyzeAction,
  buildCatalogTrackRelinkAction,
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
  const handleReanalyzeTrack = useCallback(
    async (trackId: string) =>
      runCatalogResultAction(buildCatalogTrackReanalyzeAction({ library, trackId, t, notify })),
    [library, notify, t],
  );

  const handleRelinkTrack = useCallback(
    async (trackId: string) =>
      runCatalogResultAction(buildCatalogTrackRelinkAction({ library, trackId, t, notify })),
    [library, notify, t],
  );

  const handleRelinkMissingTracks = useCallback(
    async () =>
      runCatalogResultAction(buildCatalogRelinkMissingTracksAction({ library, t, notify })),
    [library, notify, t],
  );

  const handleReanalyzeRepository = useCallback(
    async (repositoryId: string) =>
      runCatalogResultAction(
        buildCatalogRepositoryReanalyzeAction({ repositories, repositoryId, t, notify }),
      ),
    [notify, repositories, t],
  );

  const handleDeleteTrack = useCallback(
    async (trackId: string) =>
      runCatalogBooleanAction(buildCatalogTrackDeleteAction({ library, trackId, t, notify })),
    [library, notify, t],
  );

  const handleDeleteRepository = useCallback(
    async (repositoryId: string) =>
      runCatalogBooleanAction(
        buildCatalogRepositoryDeleteAction({ repositories, repositoryId, t, notify }),
      ),
    [notify, repositories, t],
  );

  const handleUpdateTrackPerformance = useCallback(
    async (trackId: string, input: UpdateTrackPerformanceInput): Promise<void> =>
      runCatalogUpdateAction(
        buildCatalogTrackPerformanceUpdateAction({
          library,
          trackId,
          performanceInput: input,
          t,
          notify,
        }),
      ),
    [library, notify, t],
  );

  const handleUpdateTrackAnalysis = useCallback(
    async (trackId: string, input: UpdateTrackAnalysisInput): Promise<void> =>
      runCatalogUpdateAction(
        buildCatalogTrackAnalysisUpdateAction({
          library,
          trackId,
          analysisInput: input,
          t,
          notify,
        }),
      ),
    [library, notify, t],
  );

  const handleSavePlaylist = useCallback(
    async (input: SaveBaseTrackPlaylistInput): Promise<boolean> =>
      runCatalogResultAction(
        buildCatalogPlaylistSaveAction({ library, playlistInput: input, t, notify }),
      ),
    [library, notify, t],
  );

  const handleDeletePlaylist = useCallback(
    async (playlistId: string): Promise<boolean> =>
      runCatalogBooleanAction(buildCatalogPlaylistDeleteAction({ library, playlistId, t, notify })),
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
