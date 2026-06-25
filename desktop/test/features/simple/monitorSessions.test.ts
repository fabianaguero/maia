import { describe, expect, it } from "vitest";

import {
  formatSessionLineCount,
  formatSessionUpdatedAt,
  resolveSessionSortTimestamp,
  sortMonitorSessions,
} from "../../../src/features/simple/monitorSessions";
import type { PersistedSession } from "../../../src/api/sessions";

describe("monitorSessions", () => {
  const baseSession = {
    trackTitle: "Track",
    sourcePath: "/logs/service.log",
    sourceTitle: "service",
    metricsSnapshot: null,
  } as unknown as PersistedSession;

  it("prefers updatedAt and falls back to createdAt for sorting timestamps", () => {
    const updated = resolveSessionSortTimestamp({
      ...baseSession,
      id: "updated",
      createdAt: "2026-01-01T10:00:00Z",
      updatedAt: "2026-01-01T11:00:00Z",
      status: "completed",
      totalAnomalies: 0,
      totalLines: 0,
    });
    const created = resolveSessionSortTimestamp({
      ...baseSession,
      id: "created",
      createdAt: "2026-01-01T12:00:00Z",
      updatedAt: "invalid",
      status: "completed",
      totalAnomalies: 0,
      totalLines: 0,
    });

    expect(updated).toBe(Date.parse("2026-01-01T11:00:00Z"));
    expect(created).toBe(Date.parse("2026-01-01T12:00:00Z"));
  });

  it("sorts sessions by status, recency, anomalies and lines", () => {
    const sessions = sortMonitorSessions([
      {
        ...baseSession,
        id: "completed-newer",
        createdAt: "2026-01-01T09:00:00Z",
        updatedAt: "2026-01-01T12:00:00Z",
        status: "completed",
        totalAnomalies: 2,
        totalLines: 400,
      },
      {
        ...baseSession,
        id: "active",
        createdAt: "2026-01-01T08:00:00Z",
        updatedAt: "2026-01-01T10:00:00Z",
        status: "active",
        totalAnomalies: 0,
        totalLines: 50,
      },
      {
        ...baseSession,
        id: "paused",
        createdAt: "2026-01-01T08:00:00Z",
        updatedAt: "2026-01-01T11:00:00Z",
        status: "paused",
        totalAnomalies: 3,
        totalLines: 120,
      },
    ] as PersistedSession[]);

    expect(sessions.map((session) => session.id)).toEqual(["active", "paused", "completed-newer"]);
  });

  it("formats session metadata strings safely", () => {
    expect(formatSessionLineCount(0)).toBe("0 lines");
    expect(formatSessionLineCount(1)).toBe("1 line");
    expect(formatSessionLineCount(12)).toBe("12 lines");
    expect(formatSessionUpdatedAt("invalid")).toBe("just now");
  });
});
