import type { PastSessionRowViewModel } from "./pastSessionsViewModel";

export interface PastSessionsCleanupPlan {
  sessionIds: string[];
  trackIds: string[];
}

export function getLostPastSessionRows(rows: PastSessionRowViewModel[]): PastSessionRowViewModel[] {
  return rows.filter((session) => Boolean(session.invalidReason));
}

export function buildLostPastSessionsCleanupPlan(
  rows: PastSessionRowViewModel[],
): PastSessionsCleanupPlan {
  const trackIds = new Set<string>();
  const sessionIds: string[] = [];

  for (const session of getLostPastSessionRows(rows)) {
    sessionIds.push(session.id);
    if (!session.isTrackAvailable && session.replayTrackId) {
      trackIds.add(session.replayTrackId);
    }
  }

  return {
    sessionIds,
    trackIds: Array.from(trackIds),
  };
}

export function buildLostPastSessionCleanupPlan(
  row: PastSessionRowViewModel,
): PastSessionsCleanupPlan {
  if (!row.invalidReason) {
    return { sessionIds: [], trackIds: [] };
  }

  return {
    sessionIds: [row.id],
    trackIds: !row.isTrackAvailable && row.replayTrackId ? [row.replayTrackId] : [],
  };
}
