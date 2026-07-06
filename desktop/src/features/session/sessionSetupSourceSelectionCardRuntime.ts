import type { AppTranslations } from "../../i18n/types";
import type { RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode } from "./sessionDisplay";

export function buildSessionSetupSourceModeTabs(input: {
  t: AppTranslations;
  mode: QuickSessionMode;
}) {
  return [
    {
      id: "log" as const,
      label: input.t.session.logFile,
      active: input.mode === "log",
    },
    {
      id: "repo" as const,
      label: input.t.session.repository,
      active: input.mode === "repo",
    },
  ];
}

export function resolveSessionSetupSourceEmptyState(input: {
  t: AppTranslations;
  mode: QuickSessionMode;
  sourceCount: number;
}): string | null {
  if (input.sourceCount > 0) {
    return null;
  }

  return input.mode === "log" ? input.t.session.noImportedLogs : input.t.session.noImportedRepos;
}

export function buildSessionSetupSourceOptions(input: {
  sourceOptions: RepositoryAnalysis[];
  selectedSourceId: string | null;
}) {
  return input.sourceOptions.map((source) => ({
    id: source.id,
    selected: input.selectedSourceId === source.id,
    title: source.title,
    path: source.sourcePath,
  }));
}

export function buildSessionSetupSourceSummary(input: {
  t: AppTranslations;
  selectedSource: RepositoryAnalysis | null;
}) {
  if (!input.selectedSource) {
    return null;
  }

  return {
    eyebrow: input.t.session.selected,
    title: input.selectedSource.title,
  };
}
