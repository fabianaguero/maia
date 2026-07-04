import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  createDirectSessionStartPlan,
  createResumeSessionPlan,
  createSessionStartPlan,
} from "../../../src/features/session/sessionStartPlanCreationRuntime";

const repository = {
  id: "repo-1",
  title: "production.log",
  sourcePath: "/logs/production.log",
  sourceKind: "file",
} as never;

const session = {
  id: "session-1",
  label: "Night watch",
  sourceId: "repo-1",
  sourceTitle: "production.log",
  sourcePath: "/logs/production.log",
  sourceKind: "file",
  trackId: "track-1",
  trackTitle: "Base Pulse",
  playlistId: null,
  playlistName: null,
  adapterKind: "file",
  mode: "live",
  status: "paused",
  fileCursor: 0,
  totalPolls: 0,
  totalLines: 0,
  totalAnomalies: 0,
  lastBpm: null,
  createdAt: "2026-06-25T00:00:00.000Z",
  updatedAt: "2026-06-25T00:00:00.000Z",
} as never;

describe("sessionStartPlanCreationRuntime", () => {
  it("creates live and direct plans", () => {
    const livePlan = createSessionStartPlan({
      baseMode: "track",
      mode: "log",
      repositories: [repository],
      selectedPlaylistId: null,
      selectedSourceId: "repo-1",
      selectedTrackId: "track-1",
      sessionLabel: "",
      copy: en,
      createSessionId: () => "session_123",
    });
    const directPlan = createDirectSessionStartPlan({
      directPath: " /var/log/custom.log ",
      selectedPlaylistId: "playlist-1",
      selectedTrackId: null,
      copy: en,
      createSessionId: () => "direct_1",
    });

    expect(livePlan.input?.label).toBe("production.log");
    expect(livePlan.draft?.sourceId).toBe("repo-1");
    expect(directPlan.input?.source).toBe("/var/log/custom.log");
    expect(directPlan.draft?.playlistId).toBe("playlist-1");
  });

  it("creates a resume plan when source data exists", () => {
    const plan = createResumeSessionPlan({
      sessionId: "session-1",
      sessions: [session],
      repositories: [repository],
      copy: en,
    });

    expect(plan.error).toBeNull();
    expect(plan.input?.source).toBe("/logs/production.log");
    expect(plan.sessionId).toBe("session-1");
  });
});
