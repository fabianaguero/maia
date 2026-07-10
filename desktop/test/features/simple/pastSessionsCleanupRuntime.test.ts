import { describe, expect, it } from "vitest";

import {
  buildLostPastSessionCleanupPlan,
  buildLostPastSessionsCleanupPlan,
  getLostPastSessionRows,
} from "../../../src/features/simple/pastSessionsCleanupRuntime";
import type { PastSessionRowViewModel } from "../../../src/features/simple/pastSessionsViewModel";

function row(overrides: Partial<PastSessionRowViewModel>): PastSessionRowViewModel {
  return {
    id: "session-1",
    name: "Session",
    trackLabel: "Track",
    status: "stopped",
    statusLabel: "Stopped",
    sourcePathLabel: "/logs/app.log",
    sourceBasenameLabel: "app.log",
    updatedAtLabel: "Updated now",
    totalAnomalies: 0,
    lineCountLabel: "0 lines",
    replaySourcePath: "/logs/app.log",
    replaySourceTitle: "app",
    replayTrackId: "track-1",
    isTrackAvailable: true,
    isSourceAvailable: true,
    validationPending: false,
    invalidReason: null,
    ...overrides,
  };
}

describe("pastSessionsCleanupRuntime", () => {
  it("selects only lost sessions", () => {
    const rows = [
      row({ id: "ok" }),
      row({ id: "lost-log", invalidReason: "Log file not found", isSourceAvailable: false }),
    ];

    expect(getLostPastSessionRows(rows).map((session) => session.id)).toEqual(["lost-log"]);
  });

  it("builds a single-session cleanup plan", () => {
    expect(
      buildLostPastSessionCleanupPlan(
        row({
          id: "lost-track",
          replayTrackId: "track-lost",
          invalidReason: "Track is missing",
          isTrackAvailable: false,
        }),
      ),
    ).toEqual({
      sessionIds: ["lost-track"],
      trackIds: ["track-lost"],
    });
  });

  it("deduplicates missing tracks for bulk cleanup", () => {
    const plan = buildLostPastSessionsCleanupPlan([
      row({ id: "ok" }),
      row({
        id: "lost-a",
        replayTrackId: "track-lost",
        invalidReason: "Track is missing",
        isTrackAvailable: false,
      }),
      row({
        id: "lost-b",
        replayTrackId: "track-lost",
        invalidReason: "Track is missing",
        isTrackAvailable: false,
      }),
      row({
        id: "lost-log",
        replayTrackId: "track-ok",
        invalidReason: "Log file not found",
        isSourceAvailable: false,
      }),
    ]);

    expect(plan).toEqual({
      sessionIds: ["lost-a", "lost-b", "lost-log"],
      trackIds: ["track-lost"],
    });
  });
});
