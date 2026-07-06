import type { ImportRepositoryInput } from "../types/library";
import {
  applyCatalogImportSuccess,
  buildBaseAssetImportNotice,
  buildCatalogImportNavigation,
  buildCompositionImportNotice,
  buildRepositoryImportNotice,
  buildTrackImportNotice,
  resolveRepositoryImportRescue,
  type CatalogImportNotice,
} from "./appCatalogImportSuccessRuntime";
import type { CatalogNotify } from "./appCatalogActionExecutionRuntime";
import type { AppTranslations, UseAppCatalogActionsInput } from "./appCatalogActionsTypes";
import type {
  ImportBaseAssetInput,
  ImportCompositionInput,
  ImportTrackInput,
} from "../types/library";

export {
  applyCatalogImportSuccess,
  buildBaseAssetImportNotice,
  buildCatalogImportNavigation,
  buildCompositionImportNotice,
  buildRepositoryImportNotice,
  buildTrackImportNotice,
  resolveRepositoryImportRescue,
} from "./appCatalogImportSuccessRuntime";
type CatalogLibrary = UseAppCatalogActionsInput["library"];
type CatalogRepositories = UseAppCatalogActionsInput["repositories"];
type CatalogBaseAssets = UseAppCatalogActionsInput["baseAssets"];
type CatalogCompositions = UseAppCatalogActionsInput["compositions"];

export interface CatalogImportActionRunners {
  handleImportTrack: (input: ImportTrackInput) => Promise<boolean>;
  handleImportRepository: (input: ImportRepositoryInput) => Promise<boolean>;
  handleImportBaseAsset: (input: ImportBaseAssetInput) => Promise<boolean>;
  handleImportComposition: (input: ImportCompositionInput) => Promise<boolean>;
}

export interface BuildCatalogImportActionRunnersInput {
  t: AppTranslations;
  notify: CatalogNotify;
  setNewlyImportedId: (id: string | null) => void;
  setAnalysisMode: (mode: "track" | "repo" | "base") => void;
  setScreen: (screen: "inspect" | "compose") => void;
  library: CatalogLibrary;
  repositories: CatalogRepositories;
  baseAssets: CatalogBaseAssets;
  compositions: CatalogCompositions;
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

export function buildCatalogImportActionRunners(
  input: BuildCatalogImportActionRunnersInput,
): CatalogImportActionRunners {
  return {
    handleImportTrack: async (importInput) =>
      runCatalogImportAction(
        buildCatalogTrackImportAction({
          library: input.library,
          importInput,
          t: input.t,
          notify: input.notify,
          setNewlyImportedId: input.setNewlyImportedId,
          setAnalysisMode: input.setAnalysisMode,
          setScreen: input.setScreen,
        }),
      ),
    handleImportRepository: async (importInput) =>
      runCatalogImportAction(
        buildCatalogRepositoryImportAction({
          repositories: input.repositories,
          importInput,
          t: input.t,
          notify: input.notify,
          setNewlyImportedId: input.setNewlyImportedId,
          setAnalysisMode: input.setAnalysisMode,
          setScreen: input.setScreen,
        }),
      ),
    handleImportBaseAsset: async (importInput) =>
      runCatalogImportAction(
        buildCatalogBaseAssetImportAction({
          baseAssets: input.baseAssets,
          importInput,
          t: input.t,
          notify: input.notify,
          setNewlyImportedId: input.setNewlyImportedId,
          setAnalysisMode: input.setAnalysisMode,
          setScreen: input.setScreen,
        }),
      ),
    handleImportComposition: async (importInput) =>
      runCatalogImportAction(
        buildCatalogCompositionImportAction({
          compositions: input.compositions,
          importInput,
          t: input.t,
          notify: input.notify,
          setNewlyImportedId: input.setNewlyImportedId,
          setAnalysisMode: input.setAnalysisMode,
          setScreen: input.setScreen,
        }),
      ),
  };
}
