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

interface BuildCatalogNamedResultActionInput<T> {
  task: () => Promise<T | null>;
  resolveName: (result: T) => string;
  successTitle: string;
  successBodyTemplate: string;
  errorTitle: string;
  notify: CatalogNotify;
}

interface BuildCatalogBooleanNoticeActionInput {
  task: () => Promise<boolean>;
  successTitle: string;
  successBody: string;
  errorTitle: string;
  notify: CatalogNotify;
}

interface BuildCatalogUpdateNoticeActionInput {
  task: () => Promise<unknown>;
  notify: CatalogNotify;
  missingTitle: string;
  missingBody: string;
  errorTitle: string;
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

export function buildCatalogNamedResultAction<T>({
  task,
  resolveName,
  successTitle,
  successBodyTemplate,
  errorTitle,
  notify,
}: BuildCatalogNamedResultActionInput<T>): RunCatalogResultActionInput<T> {
  return {
    task,
    onSuccess: (result) => ({
      tone: "success",
      title: successTitle,
      body: successBodyTemplate.replace("{title}", resolveName(result)),
    }),
    onError: (error) => ({
      tone: "error",
      title: errorTitle,
      body: String(error),
    }),
    notify,
  };
}

export function buildCatalogBooleanNoticeAction({
  task,
  successTitle,
  successBody,
  errorTitle,
  notify,
}: BuildCatalogBooleanNoticeActionInput): RunCatalogBooleanActionInput {
  return {
    task,
    onSuccess: () => ({
      tone: "success",
      title: successTitle,
      body: successBody,
    }),
    onError: (error) => ({
      tone: "error",
      title: errorTitle,
      body: String(error),
    }),
    notify,
  };
}

export function buildCatalogUpdateNoticeAction({
  task,
  notify,
  missingTitle,
  missingBody,
  errorTitle,
}: BuildCatalogUpdateNoticeActionInput): RunCatalogUpdateActionInput {
  return {
    task,
    notify,
    onMissing: {
      tone: "error",
      title: missingTitle,
      body: missingBody,
    },
    onError: (error) => ({
      tone: "error",
      title: errorTitle,
      body: String(error),
    }),
  };
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
