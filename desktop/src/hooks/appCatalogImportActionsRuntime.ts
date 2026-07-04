import { discoverRepositoryLogs } from "../api/repositories";
import { buildDiscoveredLogImportInputs } from "../appRuntime";
import type { ImportRepositoryInput } from "../types/library";
import {
  buildRepositoryImportSuccessMessage,
  scheduleImportedHighlightReset,
} from "./appCatalogActionsRuntime";
import type { AppTranslations, UseAppCatalogActionsInput } from "./appCatalogActionsTypes";

interface CatalogImportNotice {
  tone: "success" | "error";
  title: string;
  body: string;
}

interface CatalogImportNavigation {
  analysisMode: "track" | "repo" | "base";
  screen: "inspect";
}

type CatalogNotify = (tone: "success" | "error" | "info", title: string, body: string) => void;
type CatalogLibrary = UseAppCatalogActionsInput["library"];
type CatalogRepositories = UseAppCatalogActionsInput["repositories"];
type CatalogBaseAssets = UseAppCatalogActionsInput["baseAssets"];
type CatalogCompositions = UseAppCatalogActionsInput["compositions"];

export function buildCatalogImportNavigation(
  analysisMode: "track" | "repo" | "base",
): CatalogImportNavigation {
  return {
    analysisMode,
    screen: "inspect",
  };
}

export function buildTrackImportNotice(t: AppTranslations, title: string): CatalogImportNotice {
  return {
    tone: "success",
    title: t.appShell.trackImportedTitle,
    body: t.appShell.trackImportedBody.replace("{title}", title),
  };
}

export function buildBaseAssetImportNotice(t: AppTranslations, title: string): CatalogImportNotice {
  return {
    tone: "success",
    title: t.appShell.assetImportedTitle,
    body: t.appShell.assetImportedBody.replace("{title}", title),
  };
}

export function buildCompositionImportNotice(
  t: AppTranslations,
  title: string,
): CatalogImportNotice {
  return {
    tone: "success",
    title: t.appShell.compositionReadyTitle,
    body: t.appShell.compositionReadyBody.replace("{title}", title),
  };
}

export async function resolveRepositoryImportRescue(input: {
  sourceKind: ImportRepositoryInput["sourceKind"];
  sourcePath: string;
  importRepositorySource: (input: ImportRepositoryInput) => Promise<unknown>;
}): Promise<number> {
  if (input.sourceKind !== "directory") {
    return 0;
  }

  const discovered = await discoverRepositoryLogs(input.sourcePath);
  for (const nextInput of buildDiscoveredLogImportInputs(discovered)) {
    void input.importRepositorySource(nextInput);
  }
  return discovered.length;
}

export function buildRepositoryImportNotice(input: {
  t: AppTranslations;
  title: string;
  rescuedLogCount: number;
}): CatalogImportNotice {
  return {
    tone: "success",
    title: input.t.appShell.repositoryConnectedTitle,
    body: buildRepositoryImportSuccessMessage(input),
  };
}

export async function runCatalogImportAction<T>(input: {
  task: () => Promise<T | null>;
  onSuccess: (result: T) => void;
  onError: (error: unknown) => CatalogImportNotice;
  notify: (tone: "success" | "error" | "info", title: string, body: string) => void;
}): Promise<boolean> {
  try {
    const result = await input.task();
    if (!result) {
      return false;
    }

    input.onSuccess(result);
    return true;
  } catch (error) {
    const notice = input.onError(error);
    input.notify(notice.tone, notice.title, notice.body);
    return false;
  }
}

export function applyCatalogImportSuccess(input: {
  id?: string;
  notice: CatalogImportNotice;
  notify: (tone: "success" | "error" | "info", title: string, body: string) => void;
  setNewlyImportedId: (id: string | null) => void;
  navigation?: CatalogImportNavigation;
  setAnalysisMode: (mode: "track" | "repo" | "base") => void;
  setScreen: (screen: "inspect" | "compose") => void;
}) {
  input.notify(input.notice.tone, input.notice.title, input.notice.body);
  if (input.id) {
    scheduleImportedHighlightReset({
      id: input.id,
      setNewlyImportedId: input.setNewlyImportedId,
    });
  }
  if (input.navigation) {
    input.setAnalysisMode(input.navigation.analysisMode);
    input.setScreen(input.navigation.screen);
  }
}

export function buildCatalogTrackImportAction(input: {
  library: Pick<CatalogLibrary, "importLibraryTrack">;
  importInput: Parameters<CatalogLibrary["importLibraryTrack"]>[0];
  t: AppTranslations;
  notify: CatalogNotify;
  setNewlyImportedId: (id: string | null) => void;
  setAnalysisMode: (mode: "track" | "repo" | "base") => void;
  setScreen: (screen: "inspect" | "compose") => void;
}) {
  return {
    task: () => input.library.importLibraryTrack(input.importInput),
    onSuccess: (nextTrack: { id: string; tags: { title: string } }) => {
      applyCatalogImportSuccess({
        id: nextTrack.id,
        notice: buildTrackImportNotice(input.t, nextTrack.tags.title),
        notify: input.notify,
        setNewlyImportedId: input.setNewlyImportedId,
        navigation: buildCatalogImportNavigation("track"),
        setAnalysisMode: input.setAnalysisMode,
        setScreen: input.setScreen,
      });
    },
    onError: (error: unknown) => ({
      tone: "error" as const,
      title: input.t.appShell.importFailedTitle,
      body: String(error),
    }),
    notify: input.notify,
  };
}

export function buildCatalogRepositoryImportAction(input: {
  repositories: Pick<CatalogRepositories, "importRepositorySource">;
  importInput: Parameters<CatalogRepositories["importRepositorySource"]>[0];
  t: AppTranslations;
  notify: CatalogNotify;
  setNewlyImportedId: (id: string | null) => void;
  setAnalysisMode: (mode: "track" | "repo" | "base") => void;
  setScreen: (screen: "inspect" | "compose") => void;
}) {
  return {
    task: () => input.repositories.importRepositorySource(input.importInput),
    onSuccess: async (nextRepository: { id: string; title: string }) => {
      const rescuedLogCount = await resolveRepositoryImportRescue({
        sourceKind: input.importInput.sourceKind,
        sourcePath: input.importInput.sourcePath,
        importRepositorySource: input.repositories.importRepositorySource,
      });
      applyCatalogImportSuccess({
        id: nextRepository.id,
        notice: buildRepositoryImportNotice({
          t: input.t,
          title: nextRepository.title,
          rescuedLogCount,
        }),
        notify: input.notify,
        setNewlyImportedId: input.setNewlyImportedId,
        navigation: buildCatalogImportNavigation("repo"),
        setAnalysisMode: input.setAnalysisMode,
        setScreen: input.setScreen,
      });
    },
    onError: (error: unknown) => ({
      tone: "error" as const,
      title: input.t.appShell.connectionFailedTitle,
      body: String(error),
    }),
    notify: input.notify,
  };
}

export function buildCatalogBaseAssetImportAction(input: {
  baseAssets: Pick<CatalogBaseAssets, "importLibraryBaseAsset">;
  importInput: Parameters<CatalogBaseAssets["importLibraryBaseAsset"]>[0];
  t: AppTranslations;
  notify: CatalogNotify;
  setNewlyImportedId: (id: string | null) => void;
  setAnalysisMode: (mode: "track" | "repo" | "base") => void;
  setScreen: (screen: "inspect" | "compose") => void;
}) {
  return {
    task: () => input.baseAssets.importLibraryBaseAsset(input.importInput),
    onSuccess: (nextBaseAsset: { id: string; title: string }) => {
      applyCatalogImportSuccess({
        id: nextBaseAsset.id,
        notice: buildBaseAssetImportNotice(input.t, nextBaseAsset.title),
        notify: input.notify,
        setNewlyImportedId: input.setNewlyImportedId,
        navigation: buildCatalogImportNavigation("base"),
        setAnalysisMode: input.setAnalysisMode,
        setScreen: input.setScreen,
      });
    },
    onError: (error: unknown) => ({
      tone: "error" as const,
      title: input.t.appShell.assetImportFailedTitle,
      body: String(error),
    }),
    notify: input.notify,
  };
}

export function buildCatalogCompositionImportAction(input: {
  compositions: Pick<CatalogCompositions, "importLibraryComposition">;
  importInput: Parameters<CatalogCompositions["importLibraryComposition"]>[0];
  t: AppTranslations;
  notify: CatalogNotify;
  setNewlyImportedId: (id: string | null) => void;
  setAnalysisMode: (mode: "track" | "repo" | "base") => void;
  setScreen: (screen: "inspect" | "compose") => void;
}) {
  return {
    task: () => input.compositions.importLibraryComposition(input.importInput),
    onSuccess: (nextComposition: { title: string }) => {
      applyCatalogImportSuccess({
        notice: buildCompositionImportNotice(input.t, nextComposition.title),
        notify: input.notify,
        setNewlyImportedId: input.setNewlyImportedId,
        setAnalysisMode: input.setAnalysisMode,
        setScreen: input.setScreen,
      });
    },
    onError: (error: unknown) => ({
      tone: "error" as const,
      title: input.t.appShell.compositionFailedTitle,
      body: String(error),
    }),
    notify: input.notify,
  };
}
