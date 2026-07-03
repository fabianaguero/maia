import { discoverRepositoryLogs } from "../api/repositories";
import { buildDiscoveredLogImportInputs } from "../appRuntime";
import type { ImportRepositoryInput } from "../types/library";
import {
  buildRepositoryImportSuccessMessage,
  scheduleImportedHighlightReset,
} from "./appCatalogActionsRuntime";
import type { AppTranslations } from "./appCatalogActionsTypes";

interface CatalogImportNotice {
  tone: "success" | "error";
  title: string;
  body: string;
}

interface CatalogImportNavigation {
  analysisMode: "track" | "repo" | "base";
  screen: "inspect";
}

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
