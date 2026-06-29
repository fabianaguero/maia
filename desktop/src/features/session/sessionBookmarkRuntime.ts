import type { SessionBookmark, SessionEvent } from "../../api/sessions";

export interface SessionBookmarkContext {
  bpm: number | null;
  dominantLevel: string | null;
  anomalyCount: number | null;
  logExcerpt: string | null;
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
