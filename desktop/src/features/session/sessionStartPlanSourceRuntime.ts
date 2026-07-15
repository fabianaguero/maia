import type { PersistedSession } from "../../api/sessions";
import type { RepositoryAnalysis } from "../../types/library";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";

interface SessionScreenCopy {
  session: {
    fileOnlyLiveBooth: string;
    noStoredSourceResume: string;
    selectBasePlaylist: string;
    selectBaseTrack: string;
    selectLogSource: string;
    selectRepoSource: string;
    sourceNotFound: string;
    unsupportedAdapterResume: string;
  };
}

export function resolveSessionStartSourceError(input: {
  baseMode: SessionBaseMode;
  mode: QuickSessionMode;
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  copy: SessionScreenCopy;
}): string | null {
  if (!input.selectedSourceId) {
    return input.mode === "log"
      ? input.copy.session.selectLogSource
      : input.copy.session.selectRepoSource;
  }

  if (input.baseMode === "track" && !input.selectedTrackId) {
    return input.copy.session.selectBaseTrack;
  }

  if (input.baseMode === "playlist" && !input.selectedPlaylistId) {
    return input.copy.session.selectBasePlaylist;
  }

  return null;
}

export function resolveSelectedSessionRepository(
  repositories: RepositoryAnalysis[],
  selectedSourceId: string | null,
): RepositoryAnalysis | null {
  if (!selectedSourceId) {
    return null;
  }

  return repositories.find((entry) => entry.id === selectedSourceId) ?? null;
}

export function resolveRepositorySourcePathError(
  source: RepositoryAnalysis | null,
  copy: SessionScreenCopy,
): string | null {
  if (!source) {
    return copy.session.sourceNotFound;
  }

  if (source.sourceKind !== "file") {
    return copy.session.fileOnlyLiveBooth;
  }

  return null;
}

export function resolveResumeSessionSource(input: {
  sessionId: string;
  sessions: PersistedSession[];
  repositories: RepositoryAnalysis[];
}): {
  session: PersistedSession | null;
  source: RepositoryAnalysis | null;
  sourcePath: string | null;
} {
  const session = input.sessions.find((entry) => entry.id === input.sessionId) ?? null;
  if (!session) {
    return { session: null, source: null, sourcePath: null };
  }

  const source =
    input.repositories.find((entry) => entry.id === session.sourceId) ??
    input.repositories.find(
      (entry) => session.sourcePath !== null && entry.sourcePath === session.sourcePath,
    ) ??
    null;

  return {
    session,
    source,
    sourcePath: source?.sourcePath ?? session.sourcePath,
  };
}

export function resolveResumeSessionError(input: {
  session: PersistedSession | null;
  sourcePath: string | null;
  copy: SessionScreenCopy;
}): string | null {
  if (!input.session) {
    return null;
  }

  if (!input.sourcePath) {
    return input.copy.session.noStoredSourceResume;
  }

  const adapterKind = input.session.adapterKind || "file";
  if (adapterKind !== "file" && adapterKind !== "directory-tail") {
    return input.copy.session.unsupportedAdapterResume;
  }

  return null;
}
