import type { RelinkMissingTracksResult } from "../types/library";
import type { AppTranslations } from "./appCatalogActionsTypes";

export function scheduleImportedHighlightReset(input: {
  id: string;
  setNewlyImportedId: (id: string | null) => void;
  setTimeoutFn?: typeof window.setTimeout;
  clearDelayMs?: number;
}): void {
  const setTimeoutFn = input.setTimeoutFn ?? window.setTimeout;
  const clearDelayMs = input.clearDelayMs ?? 3000;

  input.setNewlyImportedId(input.id);
  setTimeoutFn(() => input.setNewlyImportedId(null), clearDelayMs);
}

export function buildRepositoryImportSuccessMessage(input: {
  t: AppTranslations;
  title: string;
  rescuedLogCount: number;
}): string {
  if (input.rescuedLogCount > 0) {
    return input.t.appShell.repositoryConnectedRescuedBody
      .replace("{title}", input.title)
      .replace("{count}", String(input.rescuedLogCount));
  }

  return input.t.appShell.repositoryConnectedBody.replace("{title}", input.title);
}

export function buildRelinkMissingTracksNotice(input: {
  t: AppTranslations;
  result: RelinkMissingTracksResult;
}):
  | { tone: "success"; title: string; body: string }
  | { tone: "info"; title: string; body: string } {
  const relinkedCount = input.result.relinkedTracks.length;
  const unresolvedCount = input.result.unresolvedTrackIds.length;

  if (relinkedCount > 0) {
    return {
      tone: "success",
      title: input.t.appShell.missingTracksRelinkedTitle,
      body:
        unresolvedCount > 0
          ? input.t.appShell.missingTracksRelinkedPartialBody
              .replace("{resolved}", String(relinkedCount))
              .replace("{missing}", String(unresolvedCount))
          : input.t.appShell.missingTracksRelinkedSuccessBody.replace(
              "{count}",
              String(relinkedCount),
            ),
    };
  }

  return {
    tone: "info",
    title: input.t.appShell.noMatchesFoundTitle,
    body: input.t.appShell.noMatchesFoundBody,
  };
}
