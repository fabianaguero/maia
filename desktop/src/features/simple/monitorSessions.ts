import type { PersistedSession } from "../../api/sessions";

export function resolveSessionSortTimestamp(session: PersistedSession): number {
  const updatedAt = Date.parse(session.updatedAt);
  if (Number.isFinite(updatedAt)) {
    return updatedAt;
  }

  const createdAt = Date.parse(session.createdAt);
  return Number.isFinite(createdAt) ? createdAt : 0;
}

export function sortMonitorSessions(sessions: PersistedSession[]): PersistedSession[] {
  return [...sessions].sort((left, right) => {
    const statusWeight = (session: PersistedSession) =>
      session.status === "active" ? 3 : session.status === "paused" ? 2 : 1;
    const statusDelta = statusWeight(right) - statusWeight(left);
    if (statusDelta !== 0) {
      return statusDelta;
    }

    const timeDelta = resolveSessionSortTimestamp(right) - resolveSessionSortTimestamp(left);
    if (timeDelta !== 0) {
      return timeDelta;
    }

    const anomalyDelta = right.totalAnomalies - left.totalAnomalies;
    if (anomalyDelta !== 0) {
      return anomalyDelta;
    }

    return right.totalLines - left.totalLines;
  });
}

export function formatSessionUpdatedAt(
  timestamp: string | null | undefined,
  locale: string,
  fallbackLabel: string,
): string {
  if (!timestamp) {
    return fallbackLabel;
  }

  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) {
    return fallbackLabel;
  }

  const date = new Date(parsed);
  return date.toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSessionLineCount(
  value: number,
  singularLabel: string,
  pluralLabel: string,
): string {
  if (!Number.isFinite(value) || value <= 0) {
    return `0 ${pluralLabel}`;
  }
  if (value === 1) {
    return `1 ${singularLabel}`;
  }
  return `${value} ${pluralLabel}`;
}
