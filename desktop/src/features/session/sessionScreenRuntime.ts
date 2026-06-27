import type { PersistedSession, SessionBookmark, SessionEvent } from "../../api/sessions";
import type { BaseTrackPlaylist, LibraryTrack, RepositoryAnalysis } from "../../types/library";
import type { StartSessionInput } from "../../types/monitor";
import type { QuickSessionMode, SessionBaseMode } from "./sessionDisplay";

export interface SessionBookmarkContext {
  bpm: number | null;
  dominantLevel: string | null;
  anomalyCount: number | null;
  logExcerpt: string | null;
}

export interface SessionStartDraft {
  sourceId?: string;
  trackId?: string;
  playlistId?: string;
}

interface SessionScreenCopy {
  session: {
    directFeed: string;
    failedCreateSession: string;
    failedReplay: string;
    failedReplayJump: string;
    failedResumeSession: string;
    fileOnlyLiveBooth: string;
    noStoredSourceReplay: string;
    noStoredSourceResume: string;
    resumedSession: string;
    selectBasePlaylist: string;
    selectBaseTrack: string;
    selectLogSource: string;
    selectRepoSource: string;
    sourceNotFound: string;
    unsupportedAdapterResume: string;
  };
}

interface SessionStartPlanResult {
  error: string | null;
  draft?: SessionStartDraft;
  input?: StartSessionInput;
  sessionId?: string;
}

export function resolveBookmarkContext(
  bookmark: SessionBookmark,
  events: SessionEvent[] | null | undefined,
): SessionBookmarkContext {
  if (!events || bookmark.eventIndex == null) {
    return {
      bpm: null,
      dominantLevel: null,
      anomalyCount: null,
      logExcerpt: null,
    };
  }

  const event = events[bookmark.eventIndex];
  if (!event) {
    return {
      bpm: null,
      dominantLevel: null,
      anomalyCount: null,
      logExcerpt: null,
    };
  }

  let logExcerpt: string | null = null;
  try {
    const parsedLines = JSON.parse(event.parsedLinesJson) as string[];
    if (parsedLines.length > 0) {
      logExcerpt = parsedLines[0]?.slice(0, 120) || null;
    }
  } catch {
    logExcerpt = null;
  }

  return {
    bpm: event.suggestedBpm,
    dominantLevel: event.dominantLevel,
    anomalyCount: event.anomalyCount,
    logExcerpt,
  };
}

export function createSessionStartPlan(
  input: {
    baseMode: SessionBaseMode;
    mode: QuickSessionMode;
    repositories: RepositoryAnalysis[];
    selectedPlaylistId: string | null;
    selectedSourceId: string | null;
    selectedTrackId: string | null;
    sessionLabel: string;
  },
  copy: SessionScreenCopy,
  createSessionId: () => string,
): SessionStartPlanResult {
  if (!input.selectedSourceId) {
    return {
      error:
        input.mode === "log" ? copy.session.selectLogSource : copy.session.selectRepoSource,
    };
  }

  if (input.baseMode === "track" && !input.selectedTrackId) {
    return { error: copy.session.selectBaseTrack };
  }

  if (input.baseMode === "playlist" && !input.selectedPlaylistId) {
    return { error: copy.session.selectBasePlaylist };
  }

  const source = input.repositories.find((entry) => entry.id === input.selectedSourceId) ?? null;
  if (!source) {
    return { error: copy.session.sourceNotFound };
  }

  if (source.sourceKind !== "file") {
    return { error: copy.session.fileOnlyLiveBooth };
  }

  const sessionId = createSessionId();
  return {
    error: null,
    sessionId,
    input: {
      sessionId,
      adapterKind: "file",
      source: source.sourcePath,
      label: input.sessionLabel || source.title,
      startFromBeginning: true,
    },
    draft: {
      sourceId: source.id,
      trackId: input.baseMode === "track" ? (input.selectedTrackId ?? undefined) : undefined,
      playlistId:
        input.baseMode === "playlist" ? (input.selectedPlaylistId ?? undefined) : undefined,
    },
  };
}

export function createDirectSessionStartPlan(
  input: {
    directPath: string;
    selectedPlaylistId: string | null;
    selectedTrackId: string | null;
  },
  copy: SessionScreenCopy,
  createSessionId: () => string,
): SessionStartPlanResult {
  const source = input.directPath.trim();
  if (!source) {
    return { error: null };
  }

  const sessionId = createSessionId();
  return {
    error: null,
    sessionId,
    input: {
      sessionId,
      adapterKind: "file",
      source,
      label: source.split("/").pop() || copy.session.directFeed,
      startFromBeginning: true,
    },
    draft: {
      trackId: input.selectedTrackId ?? undefined,
      playlistId: input.selectedPlaylistId ?? undefined,
    },
  };
}

export function createResumeSessionPlan(
  sessionId: string,
  sessions: PersistedSession[],
  repositories: RepositoryAnalysis[],
  copy: SessionScreenCopy,
): SessionStartPlanResult {
  const session = sessions.find((entry) => entry.id === sessionId) ?? null;
  if (!session) {
    return { error: null };
  }

  const source =
    repositories.find((entry) => entry.id === session.sourceId) ??
    repositories.find(
      (entry) => session.sourcePath !== null && entry.sourcePath === session.sourcePath,
    ) ??
    null;

  const sourcePath = source?.sourcePath ?? session.sourcePath;
  if (!sourcePath) {
    return { error: copy.session.noStoredSourceResume };
  }

  if ((session.adapterKind || "file") !== "file") {
    return { error: copy.session.unsupportedAdapterResume };
  }

  return {
    error: null,
    sessionId: session.id,
    input: {
      sessionId: session.id,
      adapterKind: "file",
      source: sourcePath,
      label: session.label || source?.title || session.sourceTitle || copy.session.resumedSession,
    },
    draft: {
      sourceId: session.sourceId ?? undefined,
      trackId: session.trackId ?? undefined,
      playlistId: session.playlistId ?? undefined,
    },
  };
}

export function resolveReplaySessionError(
  session: PersistedSession | null,
  copy: SessionScreenCopy,
): string | null {
  if (!session?.sourcePath) {
    return copy.session.noStoredSourceReplay;
  }

  return null;
}

export function resolveReplayBookmarkError(
  success: boolean,
  copy: SessionScreenCopy,
): string | null {
  return success ? null : copy.session.failedReplayJump;
}

export function resolveReplaySessionFailure(
  success: boolean,
  copy: SessionScreenCopy,
): string | null {
  return success ? null : copy.session.failedReplay;
}

export function buildSessionLabelPlaceholder(input: {
  selectedBaseLabel: string | null;
  selectedSourceTitle: string | null;
  templateGenre: string | null;
  templateLabel: string | null;
  fallbackLabel: string;
}): string {
  if (input.selectedSourceTitle && input.selectedBaseLabel) {
    return `${input.selectedSourceTitle} · ${input.selectedBaseLabel} · ${input.templateGenre ?? ""}`;
  }

  return input.templateLabel ?? input.fallbackLabel;
}

export function resolvePlaybackPercent(activePlaybackProgress: number | null): number | null {
  if (typeof activePlaybackProgress !== "number") {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(activePlaybackProgress * 100)));
}

export function resolveReadyToRun(input: {
  baseMode: SessionBaseMode;
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
}): boolean {
  return Boolean(
    input.selectedSourceId &&
      (input.baseMode === "track" ? input.selectedTrackId : input.selectedPlaylistId),
  );
}

export function createSessionTimestampId(prefix: string, now = Date.now()): string {
  return `${prefix}_${now}`;
}

export function resolveSourceOptions(
  mode: QuickSessionMode,
  repositories: RepositoryAnalysis[],
): RepositoryAnalysis[] {
  return repositories.filter((entry) =>
    mode === "log" ? entry.sourceKind === "file" : entry.sourceKind !== "file",
  );
}

export function resolveSelectedEntities(input: {
  playlists: BaseTrackPlaylist[];
  repositories: RepositoryAnalysis[];
  selectedPlaylistId: string | null;
  selectedSourceId: string | null;
  selectedTrackId: string | null;
  tracks: LibraryTrack[];
}): {
  selectedPlaylist: BaseTrackPlaylist | null;
  selectedSource: RepositoryAnalysis | null;
  selectedTrack: LibraryTrack | null;
} {
  return {
    selectedSource:
      input.repositories.find((repository) => repository.id === input.selectedSourceId) ?? null,
    selectedTrack: input.tracks.find((track) => track.id === input.selectedTrackId) ?? null,
    selectedPlaylist:
      input.playlists.find((playlist) => playlist.id === input.selectedPlaylistId) ?? null,
  };
}
