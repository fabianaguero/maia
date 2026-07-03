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
} from "./appCatalogLibraryActionsRuntime";
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
    async (trackId: string) =>
      runCatalogResultAction({
        task: () => library.reanalyzeTrack(trackId),
        onSuccess: (nextTrack) => ({
          tone: "success",
          title: t.appShell.reanalysisCompleteTitle,
          body: t.appShell.reanalysisCompleteBody.replace("{title}", nextTrack.tags.title),
        }),
        onError: (err) => ({
          tone: "error",
          title: t.appShell.reanalysisFailedTitle,
          body: String(err),
        }),
        notify,
      }),
    [library, notify, t],
  );

  const handleRelinkTrack = useCallback(
    async (trackId: string) =>
      runCatalogResultAction({
        task: () => library.relinkTrack(trackId),
        onSuccess: (nextTrack) => ({
          tone: "success",
          title: t.appShell.trackRelinkedTitle,
          body: t.appShell.trackRelinkedBody.replace("{title}", nextTrack.tags.title),
        }),
        onError: (err) => ({
          tone: "error",
          title: t.appShell.relinkFailedTitle,
          body: String(err),
        }),
        notify,
      }),
    [library, notify, t],
  );

  const handleRelinkMissingTracks = useCallback(
    async () =>
      runCatalogResultAction({
        task: () => library.relinkMissingTracksFromDirectory(),
        onSuccess: (result) => buildRelinkMissingTracksNotice({ t, result }),
        onError: (err) => ({
          tone: "error",
          title: t.appShell.bulkRelinkFailedTitle,
          body: String(err),
        }),
        notify,
      }),
    [library, notify, t],
  );

  const handleReanalyzeRepository = useCallback(
    async (repositoryId: string) =>
      runCatalogResultAction({
        task: () => repositories.reanalyzeRepository(repositoryId),
        onSuccess: (nextRepository) => ({
          tone: "success",
          title: t.appShell.reanalysisCompleteTitle,
          body: t.appShell.reanalysisCompleteBody.replace("{title}", nextRepository.title),
        }),
        onError: (err) => ({
          tone: "error",
          title: t.appShell.reanalysisFailedTitle,
          body: String(err),
        }),
        notify,
      }),
    [notify, repositories, t],
  );

  const handleDeleteTrack = useCallback(
    async (trackId: string) =>
      runCatalogBooleanAction({
        task: () => library.deleteLibraryTrack(trackId),
        onSuccess: () => ({
          tone: "success",
          title: t.appShell.trackDeletedTitle,
          body: t.appShell.trackDeletedBody,
        }),
        onError: (err) => ({
          tone: "error",
          title: t.appShell.deleteFailedTitle,
          body: String(err),
        }),
        notify,
      }),
    [library, notify, t],
  );

  const handleDeleteRepository = useCallback(
    async (repositoryId: string) =>
      runCatalogBooleanAction({
        task: () => repositories.deleteLibraryRepository(repositoryId),
        onSuccess: () => ({
          tone: "success",
          title: t.appShell.repositoryDeletedTitle,
          body: t.appShell.repositoryDeletedBody,
        }),
        onError: (err) => ({
          tone: "error",
          title: t.appShell.deleteFailedTitle,
          body: String(err),
        }),
        notify,
      }),
    [notify, repositories, t],
  );

  const handleUpdateTrackPerformance = useCallback(
    async (trackId: string, input: UpdateTrackPerformanceInput): Promise<void> =>
      runCatalogUpdateAction({
        task: () => library.updateTrackPerformance(trackId, input),
        notify,
        onMissing: {
          tone: "error",
          title: t.appShell.trackUpdateFailedTitle,
          body: t.appShell.trackUpdateFailedBody,
        },
        onError: (err) => ({
          tone: "error",
          title: t.appShell.trackUpdateFailedTitle,
          body: String(err),
        }),
      }),
    [library, notify, t],
  );

  const handleUpdateTrackAnalysis = useCallback(
    async (trackId: string, input: UpdateTrackAnalysisInput): Promise<void> =>
      runCatalogUpdateAction({
        task: () => library.updateTrackAnalysis(trackId, input),
        notify,
        onMissing: {
          tone: "error",
          title: t.appShell.beatGridUpdateFailedTitle,
          body: t.appShell.beatGridUpdateFailedBody,
        },
        onError: (err) => ({
          tone: "error",
          title: t.appShell.beatGridUpdateFailedTitle,
          body: String(err),
        }),
      }),
    [library, notify, t],
  );

  const handleSavePlaylist = useCallback(
    async (input: SaveBaseTrackPlaylistInput): Promise<boolean> =>
      runCatalogResultAction({
        task: () => library.savePlaylist(input),
        onSuccess: (nextPlaylist) => ({
          tone: "success",
          title: t.appShell.playlistSavedTitle,
          body: t.appShell.playlistSavedBody.replace("{name}", nextPlaylist.name),
        }),
        onError: (err) => ({
          tone: "error",
          title: t.appShell.playlistSaveFailedTitle,
          body: String(err),
        }),
        notify,
      }),
    [library, notify, t],
  );

  const handleDeletePlaylist = useCallback(
    async (playlistId: string): Promise<boolean> =>
      runCatalogBooleanAction({
        task: () => library.deletePlaylist(playlistId),
        onSuccess: () => ({
          tone: "success",
          title: t.appShell.playlistDeletedTitle,
          body: t.appShell.playlistDeletedBody,
        }),
        onError: (err) => ({
          tone: "error",
          title: t.appShell.playlistDeleteFailedTitle,
          body: String(err),
        }),
        notify,
      }),
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
