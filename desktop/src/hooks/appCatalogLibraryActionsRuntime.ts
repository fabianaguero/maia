import type {
  SaveBaseTrackPlaylistInput,
  UpdateTrackAnalysisInput,
  UpdateTrackPerformanceInput,
} from "../types/library";
import { buildRelinkMissingTracksNotice } from "./appCatalogActionsRuntime";
import {
  buildCatalogBooleanNoticeAction,
  buildCatalogNamedResultAction,
  buildCatalogUpdateNoticeAction,
  runCatalogBooleanAction,
  runCatalogResultAction,
  runCatalogUpdateAction,
  type CatalogNotify,
  type RunCatalogBooleanActionInput,
  type RunCatalogResultActionInput,
  type RunCatalogUpdateActionInput,
} from "./appCatalogActionExecutionRuntime";
import type { AppTranslations, UseAppCatalogActionsInput } from "./appCatalogActionsTypes";

export {
  buildCatalogBooleanNoticeAction,
  buildCatalogNamedResultAction,
  buildCatalogUpdateNoticeAction,
  runCatalogBooleanAction,
  runCatalogResultAction,
  runCatalogUpdateAction,
} from "./appCatalogActionExecutionRuntime";
type CatalogLibrary = UseAppCatalogActionsInput["library"];
type CatalogRepositories = UseAppCatalogActionsInput["repositories"];

export interface CatalogLibraryActionRunners {
  handleReanalyzeTrack: (trackId: string) => Promise<boolean>;
  handleRelinkTrack: (trackId: string) => Promise<boolean>;
  handleRelinkMissingTracks: () => Promise<boolean>;
  handleReanalyzeRepository: (repositoryId: string) => Promise<boolean>;
  handleDeleteTrack: (trackId: string) => Promise<boolean>;
  handleDeleteRepository: (repositoryId: string) => Promise<boolean>;
  handleUpdateTrackPerformance: (
    trackId: string,
    input: UpdateTrackPerformanceInput,
  ) => Promise<void>;
  handleUpdateTrackAnalysis: (trackId: string, input: UpdateTrackAnalysisInput) => Promise<void>;
  handleSavePlaylist: (input: SaveBaseTrackPlaylistInput) => Promise<boolean>;
  handleDeletePlaylist: (playlistId: string) => Promise<boolean>;
}

export interface BuildCatalogLibraryActionRunnersInput {
  t: AppTranslations;
  notify: CatalogNotify;
  library: CatalogLibrary;
  repositories: CatalogRepositories;
}

export function buildCatalogTrackReanalyzeAction(input: {
  library: Pick<CatalogLibrary, "reanalyzeTrack">;
  trackId: string;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogResultActionInput<{ tags: { title: string } }> {
  return buildCatalogNamedResultAction<{ tags: { title: string } }>({
    task: () => input.library.reanalyzeTrack(input.trackId),
    resolveName: (nextTrack) => nextTrack.tags.title,
    successTitle: input.t.appShell.reanalysisCompleteTitle,
    successBodyTemplate: input.t.appShell.reanalysisCompleteBody,
    errorTitle: input.t.appShell.reanalysisFailedTitle,
    notify: input.notify,
  });
}

export function buildCatalogTrackRelinkAction(input: {
  library: Pick<CatalogLibrary, "relinkTrack">;
  trackId: string;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogResultActionInput<{ tags: { title: string } }> {
  return buildCatalogNamedResultAction<{ tags: { title: string } }>({
    task: () => input.library.relinkTrack(input.trackId),
    resolveName: (nextTrack) => nextTrack.tags.title,
    successTitle: input.t.appShell.trackRelinkedTitle,
    successBodyTemplate: input.t.appShell.trackRelinkedBody,
    errorTitle: input.t.appShell.relinkFailedTitle,
    notify: input.notify,
  });
}

export function buildCatalogRelinkMissingTracksAction(input: {
  library: Pick<CatalogLibrary, "relinkMissingTracksFromDirectory">;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogResultActionInput<
  NonNullable<Awaited<ReturnType<CatalogLibrary["relinkMissingTracksFromDirectory"]>>>
> {
  return {
    task: () => input.library.relinkMissingTracksFromDirectory(),
    onSuccess: (result) => buildRelinkMissingTracksNotice({ t: input.t, result }),
    onError: (error) => ({
      tone: "error",
      title: input.t.appShell.bulkRelinkFailedTitle,
      body: String(error),
    }),
    notify: input.notify,
  };
}

export function buildCatalogRepositoryReanalyzeAction(input: {
  repositories: Pick<CatalogRepositories, "reanalyzeRepository">;
  repositoryId: string;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogResultActionInput<{ title: string }> {
  return buildCatalogNamedResultAction<{ title: string }>({
    task: () => input.repositories.reanalyzeRepository(input.repositoryId),
    resolveName: (nextRepository) => nextRepository.title,
    successTitle: input.t.appShell.reanalysisCompleteTitle,
    successBodyTemplate: input.t.appShell.reanalysisCompleteBody,
    errorTitle: input.t.appShell.reanalysisFailedTitle,
    notify: input.notify,
  });
}

export function buildCatalogTrackDeleteAction(input: {
  library: Pick<CatalogLibrary, "deleteLibraryTrack">;
  trackId: string;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogBooleanActionInput {
  return buildCatalogBooleanNoticeAction({
    task: () => input.library.deleteLibraryTrack(input.trackId),
    successTitle: input.t.appShell.trackDeletedTitle,
    successBody: input.t.appShell.trackDeletedBody,
    errorTitle: input.t.appShell.deleteFailedTitle,
    notify: input.notify,
  });
}

export function buildCatalogRepositoryDeleteAction(input: {
  repositories: Pick<CatalogRepositories, "deleteLibraryRepository">;
  repositoryId: string;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogBooleanActionInput {
  return buildCatalogBooleanNoticeAction({
    task: () => input.repositories.deleteLibraryRepository(input.repositoryId),
    successTitle: input.t.appShell.repositoryDeletedTitle,
    successBody: input.t.appShell.repositoryDeletedBody,
    errorTitle: input.t.appShell.deleteFailedTitle,
    notify: input.notify,
  });
}

export function buildCatalogTrackPerformanceUpdateAction(input: {
  library: Pick<CatalogLibrary, "updateTrackPerformance">;
  trackId: string;
  performanceInput: Parameters<CatalogLibrary["updateTrackPerformance"]>[1];
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogUpdateActionInput {
  return buildCatalogUpdateNoticeAction({
    task: () => input.library.updateTrackPerformance(input.trackId, input.performanceInput),
    notify: input.notify,
    missingTitle: input.t.appShell.trackUpdateFailedTitle,
    missingBody: input.t.appShell.trackUpdateFailedBody,
    errorTitle: input.t.appShell.trackUpdateFailedTitle,
  });
}

export function buildCatalogTrackAnalysisUpdateAction(input: {
  library: Pick<CatalogLibrary, "updateTrackAnalysis">;
  trackId: string;
  analysisInput: Parameters<CatalogLibrary["updateTrackAnalysis"]>[1];
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogUpdateActionInput {
  return buildCatalogUpdateNoticeAction({
    task: () => input.library.updateTrackAnalysis(input.trackId, input.analysisInput),
    notify: input.notify,
    missingTitle: input.t.appShell.beatGridUpdateFailedTitle,
    missingBody: input.t.appShell.beatGridUpdateFailedBody,
    errorTitle: input.t.appShell.beatGridUpdateFailedTitle,
  });
}

export function buildCatalogPlaylistSaveAction(input: {
  library: Pick<CatalogLibrary, "savePlaylist">;
  playlistInput: Parameters<CatalogLibrary["savePlaylist"]>[0];
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogResultActionInput<{ name: string }> {
  return buildCatalogNamedResultAction<{ name: string }>({
    task: () => input.library.savePlaylist(input.playlistInput),
    resolveName: (nextPlaylist) => nextPlaylist.name,
    successTitle: input.t.appShell.playlistSavedTitle,
    successBodyTemplate: input.t.appShell.playlistSavedBody.replace("{name}", "{title}"),
    errorTitle: input.t.appShell.playlistSaveFailedTitle,
    notify: input.notify,
  });
}

export function buildCatalogPlaylistDeleteAction(input: {
  library: Pick<CatalogLibrary, "deletePlaylist">;
  playlistId: string;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogBooleanActionInput {
  return buildCatalogBooleanNoticeAction({
    task: () => input.library.deletePlaylist(input.playlistId),
    successTitle: input.t.appShell.playlistDeletedTitle,
    successBody: input.t.appShell.playlistDeletedBody,
    errorTitle: input.t.appShell.playlistDeleteFailedTitle,
    notify: input.notify,
  });
}

export function buildCatalogLibraryActionRunners(
  input: BuildCatalogLibraryActionRunnersInput,
): CatalogLibraryActionRunners {
  return {
    handleReanalyzeTrack: async (trackId) =>
      runCatalogResultAction(
        buildCatalogTrackReanalyzeAction({
          library: input.library,
          trackId,
          t: input.t,
          notify: input.notify,
        }),
      ),
    handleRelinkTrack: async (trackId) =>
      runCatalogResultAction(
        buildCatalogTrackRelinkAction({
          library: input.library,
          trackId,
          t: input.t,
          notify: input.notify,
        }),
      ),
    handleRelinkMissingTracks: async () =>
      runCatalogResultAction(
        buildCatalogRelinkMissingTracksAction({
          library: input.library,
          t: input.t,
          notify: input.notify,
        }),
      ),
    handleReanalyzeRepository: async (repositoryId) =>
      runCatalogResultAction(
        buildCatalogRepositoryReanalyzeAction({
          repositories: input.repositories,
          repositoryId,
          t: input.t,
          notify: input.notify,
        }),
      ),
    handleDeleteTrack: async (trackId) =>
      runCatalogBooleanAction(
        buildCatalogTrackDeleteAction({
          library: input.library,
          trackId,
          t: input.t,
          notify: input.notify,
        }),
      ),
    handleDeleteRepository: async (repositoryId) =>
      runCatalogBooleanAction(
        buildCatalogRepositoryDeleteAction({
          repositories: input.repositories,
          repositoryId,
          t: input.t,
          notify: input.notify,
        }),
      ),
    handleUpdateTrackPerformance: async (trackId, performanceInput) =>
      runCatalogUpdateAction(
        buildCatalogTrackPerformanceUpdateAction({
          library: input.library,
          trackId,
          performanceInput,
          t: input.t,
          notify: input.notify,
        }),
      ),
    handleUpdateTrackAnalysis: async (trackId, analysisInput) =>
      runCatalogUpdateAction(
        buildCatalogTrackAnalysisUpdateAction({
          library: input.library,
          trackId,
          analysisInput,
          t: input.t,
          notify: input.notify,
        }),
      ),
    handleSavePlaylist: async (playlistInput) =>
      runCatalogResultAction(
        buildCatalogPlaylistSaveAction({
          library: input.library,
          playlistInput,
          t: input.t,
          notify: input.notify,
        }),
      ),
    handleDeletePlaylist: async (playlistId) =>
      runCatalogBooleanAction(
        buildCatalogPlaylistDeleteAction({
          library: input.library,
          playlistId,
          t: input.t,
          notify: input.notify,
        }),
      ),
  };
}
