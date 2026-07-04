import { buildRelinkMissingTracksNotice } from "./appCatalogActionsRuntime";
import type { AppTranslations, UseAppCatalogActionsInput } from "./appCatalogActionsTypes";

interface CatalogNotice {
  tone: "success" | "error" | "info";
  title: string;
  body: string;
}

type CatalogNotify = (tone: "success" | "error" | "info", title: string, body: string) => void;
type CatalogLibrary = UseAppCatalogActionsInput["library"];
type CatalogRepositories = UseAppCatalogActionsInput["repositories"];

interface RunCatalogResultActionInput<T> {
  task: () => Promise<T | null>;
  onSuccess: (result: T) => CatalogNotice;
  onError: (error: unknown) => CatalogNotice;
  onEmpty?: () => CatalogNotice | null;
  notify: (tone: "success" | "error" | "info", title: string, body: string) => void;
}

export async function runCatalogResultAction<T>({
  task,
  onSuccess,
  onError,
  onEmpty,
  notify,
}: RunCatalogResultActionInput<T>): Promise<boolean> {
  try {
    const result = await task();
    if (!result) {
      const emptyNotice = onEmpty?.() ?? null;
      if (emptyNotice) {
        notify(emptyNotice.tone, emptyNotice.title, emptyNotice.body);
      }
      return false;
    }

    const notice = onSuccess(result);
    notify(notice.tone, notice.title, notice.body);
    return true;
  } catch (error) {
    const notice = onError(error);
    notify(notice.tone, notice.title, notice.body);
    return false;
  }
}

interface RunCatalogBooleanActionInput {
  task: () => Promise<boolean>;
  onSuccess: () => CatalogNotice;
  onError: (error: unknown) => CatalogNotice;
  notify: (tone: "success" | "error" | "info", title: string, body: string) => void;
}

export async function runCatalogBooleanAction({
  task,
  onSuccess,
  onError,
  notify,
}: RunCatalogBooleanActionInput): Promise<boolean> {
  try {
    const success = await task();
    if (!success) {
      return false;
    }

    const notice = onSuccess();
    notify(notice.tone, notice.title, notice.body);
    return true;
  } catch (error) {
    const notice = onError(error);
    notify(notice.tone, notice.title, notice.body);
    return false;
  }
}

interface RunCatalogUpdateActionInput {
  task: () => Promise<unknown>;
  notify: (tone: "success" | "error" | "info", title: string, body: string) => void;
  onMissing: CatalogNotice;
  onError: (error: unknown) => CatalogNotice;
}

export async function runCatalogUpdateAction({
  task,
  notify,
  onMissing,
  onError,
}: RunCatalogUpdateActionInput): Promise<void> {
  try {
    const result = await task();
    if (!result) {
      notify(onMissing.tone, onMissing.title, onMissing.body);
    }
  } catch (error) {
    const notice = onError(error);
    notify(notice.tone, notice.title, notice.body);
  }
}

export function buildCatalogTrackReanalyzeAction(input: {
  library: Pick<CatalogLibrary, "reanalyzeTrack">;
  trackId: string;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogResultActionInput<{ tags: { title: string } }> {
  return {
    task: () => input.library.reanalyzeTrack(input.trackId),
    onSuccess: (nextTrack) => ({
      tone: "success",
      title: input.t.appShell.reanalysisCompleteTitle,
      body: input.t.appShell.reanalysisCompleteBody.replace("{title}", nextTrack.tags.title),
    }),
    onError: (error) => ({
      tone: "error",
      title: input.t.appShell.reanalysisFailedTitle,
      body: String(error),
    }),
    notify: input.notify,
  };
}

export function buildCatalogTrackRelinkAction(input: {
  library: Pick<CatalogLibrary, "relinkTrack">;
  trackId: string;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogResultActionInput<{ tags: { title: string } }> {
  return {
    task: () => input.library.relinkTrack(input.trackId),
    onSuccess: (nextTrack) => ({
      tone: "success",
      title: input.t.appShell.trackRelinkedTitle,
      body: input.t.appShell.trackRelinkedBody.replace("{title}", nextTrack.tags.title),
    }),
    onError: (error) => ({
      tone: "error",
      title: input.t.appShell.relinkFailedTitle,
      body: String(error),
    }),
    notify: input.notify,
  };
}

export function buildCatalogRelinkMissingTracksAction(input: {
  library: Pick<CatalogLibrary, "relinkMissingTracksFromDirectory">;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogResultActionInput<NonNullable<Awaited<ReturnType<CatalogLibrary["relinkMissingTracksFromDirectory"]>>>> {
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
  return {
    task: () => input.repositories.reanalyzeRepository(input.repositoryId),
    onSuccess: (nextRepository) => ({
      tone: "success",
      title: input.t.appShell.reanalysisCompleteTitle,
      body: input.t.appShell.reanalysisCompleteBody.replace("{title}", nextRepository.title),
    }),
    onError: (error) => ({
      tone: "error",
      title: input.t.appShell.reanalysisFailedTitle,
      body: String(error),
    }),
    notify: input.notify,
  };
}

export function buildCatalogTrackDeleteAction(input: {
  library: Pick<CatalogLibrary, "deleteLibraryTrack">;
  trackId: string;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogBooleanActionInput {
  return {
    task: () => input.library.deleteLibraryTrack(input.trackId),
    onSuccess: () => ({
      tone: "success",
      title: input.t.appShell.trackDeletedTitle,
      body: input.t.appShell.trackDeletedBody,
    }),
    onError: (error) => ({
      tone: "error",
      title: input.t.appShell.deleteFailedTitle,
      body: String(error),
    }),
    notify: input.notify,
  };
}

export function buildCatalogRepositoryDeleteAction(input: {
  repositories: Pick<CatalogRepositories, "deleteLibraryRepository">;
  repositoryId: string;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogBooleanActionInput {
  return {
    task: () => input.repositories.deleteLibraryRepository(input.repositoryId),
    onSuccess: () => ({
      tone: "success",
      title: input.t.appShell.repositoryDeletedTitle,
      body: input.t.appShell.repositoryDeletedBody,
    }),
    onError: (error) => ({
      tone: "error",
      title: input.t.appShell.deleteFailedTitle,
      body: String(error),
    }),
    notify: input.notify,
  };
}

export function buildCatalogTrackPerformanceUpdateAction(input: {
  library: Pick<CatalogLibrary, "updateTrackPerformance">;
  trackId: string;
  performanceInput: Parameters<CatalogLibrary["updateTrackPerformance"]>[1];
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogUpdateActionInput {
  return {
    task: () => input.library.updateTrackPerformance(input.trackId, input.performanceInput),
    notify: input.notify,
    onMissing: {
      tone: "error",
      title: input.t.appShell.trackUpdateFailedTitle,
      body: input.t.appShell.trackUpdateFailedBody,
    },
    onError: (error) => ({
      tone: "error",
      title: input.t.appShell.trackUpdateFailedTitle,
      body: String(error),
    }),
  };
}

export function buildCatalogTrackAnalysisUpdateAction(input: {
  library: Pick<CatalogLibrary, "updateTrackAnalysis">;
  trackId: string;
  analysisInput: Parameters<CatalogLibrary["updateTrackAnalysis"]>[1];
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogUpdateActionInput {
  return {
    task: () => input.library.updateTrackAnalysis(input.trackId, input.analysisInput),
    notify: input.notify,
    onMissing: {
      tone: "error",
      title: input.t.appShell.beatGridUpdateFailedTitle,
      body: input.t.appShell.beatGridUpdateFailedBody,
    },
    onError: (error) => ({
      tone: "error",
      title: input.t.appShell.beatGridUpdateFailedTitle,
      body: String(error),
    }),
  };
}

export function buildCatalogPlaylistSaveAction(input: {
  library: Pick<CatalogLibrary, "savePlaylist">;
  playlistInput: Parameters<CatalogLibrary["savePlaylist"]>[0];
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogResultActionInput<{ name: string }> {
  return {
    task: () => input.library.savePlaylist(input.playlistInput),
    onSuccess: (nextPlaylist) => ({
      tone: "success",
      title: input.t.appShell.playlistSavedTitle,
      body: input.t.appShell.playlistSavedBody.replace("{name}", nextPlaylist.name),
    }),
    onError: (error) => ({
      tone: "error",
      title: input.t.appShell.playlistSaveFailedTitle,
      body: String(error),
    }),
    notify: input.notify,
  };
}

export function buildCatalogPlaylistDeleteAction(input: {
  library: Pick<CatalogLibrary, "deletePlaylist">;
  playlistId: string;
  t: AppTranslations;
  notify: CatalogNotify;
}): RunCatalogBooleanActionInput {
  return {
    task: () => input.library.deletePlaylist(input.playlistId),
    onSuccess: () => ({
      tone: "success",
      title: input.t.appShell.playlistDeletedTitle,
      body: input.t.appShell.playlistDeletedBody,
    }),
    onError: (error) => ({
      tone: "error",
      title: input.t.appShell.playlistDeleteFailedTitle,
      body: String(error),
    }),
    notify: input.notify,
  };
}
