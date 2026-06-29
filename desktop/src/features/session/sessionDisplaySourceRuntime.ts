import { convertFileSrc, isTauri } from "@tauri-apps/api/core";
import type { RepositoryAnalysis } from "../../types/library";
import type { PersistedSession } from "../../api/sessions";

export function resolveSourceDetails(
  session: PersistedSession | null,
  repositories: RepositoryAnalysis[],
): { label: string | null; path: string | null } {
  if (!session) {
    return { label: null, path: null };
  }

  const repository =
    (session.sourceId ? repositories.find((entry) => entry.id === session.sourceId) : null) ??
    repositories.find(
      (entry) => session.sourcePath !== null && entry.sourcePath === session.sourcePath,
    ) ??
    null;

  return {
    label: repository?.title ?? session.sourceTitle ?? null,
    path: repository?.sourcePath ?? session.sourcePath ?? null,
  };
}

export function resolveSessionBedUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (isTauri()) {
    return convertFileSrc(path);
  }

  return null;
}
