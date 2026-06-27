import { describe, expect, it } from "vitest";

import type { PersistedSession, SessionBookmark, SessionEvent } from "../../../src/api/sessions";
import { en } from "../../../src/i18n/en";
import type { RepositoryAnalysis } from "../../../src/types/library";
import {
  buildSessionLabelPlaceholder,
  createDirectSessionStartPlan,
  createResumeSessionPlan,
  createSessionStartPlan,
  createSessionTimestampId,
  resolveBookmarkContext,
  resolvePlaybackPercent,
  resolveReadyToRun,
  resolveReplayBookmarkError,
  resolveReplaySessionError,
  resolveReplaySessionFailure,
  resolveSourceOptions,
} from "../../../src/features/session/sessionScreenRuntime";

const repository: RepositoryAnalysis = {
  id: "repo-1",
  title: "production.log",
  sourcePath: "/logs/production.log",
  storagePath: null,
  sourceKind: "file",
  importedAt: "2026-06-25T00:00:00.000Z",
  suggestedBpm: null,
  confidence: 0,
  summary: "",
  analyzerStatus: "ready",
  buildSystem: "",
  primaryLanguage: "logs",
  javaFileCount: 0,
  testFileCount: 0,
  waveformBins: [],
  beatGrid: [],
  bpmCurve: [],
  notes: [],
  tags: [],
  metrics: {},
};

const session: PersistedSession = {
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
  sourceTemplateId: null,
};

describe("sessionScreenRuntime", () => {
  it("builds bookmark context from stored event payload", () => {
    const bookmark = {
      id: 1,
      eventIndex: 0,
    } as SessionBookmark;
    const events = [
      {
        suggestedBpm: 126,
        dominantLevel: "error",
        anomalyCount: 3,
        parsedLinesJson: JSON.stringify(["first line", "second line"]),
      },
    ] as SessionEvent[];

    expect(resolveBookmarkContext(bookmark, events)).toEqual({
      bpm: 126,
      dominantLevel: "error",
      anomalyCount: 3,
      logExcerpt: "first line",
    });
  });

  it("creates a valid live session plan for file sources", () => {
    const plan = createSessionStartPlan(
      {
        baseMode: "track",
        mode: "log",
        repositories: [repository],
        selectedPlaylistId: null,
        selectedSourceId: "repo-1",
        selectedTrackId: "track-1",
        sessionLabel: "",
      },
      en,
      () => "session_123",
    );

    expect(plan.error).toBeNull();
    expect(plan.input).toEqual({
      sessionId: "session_123",
      adapterKind: "file",
      source: "/logs/production.log",
      label: "production.log",
      startFromBeginning: true,
    });
    expect(plan.draft).toEqual({
      sourceId: "repo-1",
      trackId: "track-1",
      playlistId: undefined,
    });
  });

  it("rejects session creation when a playlist base is missing", () => {
    const plan = createSessionStartPlan(
      {
        baseMode: "playlist",
        mode: "log",
        repositories: [repository],
        selectedPlaylistId: null,
        selectedSourceId: "repo-1",
        selectedTrackId: null,
        sessionLabel: "ops",
      },
      en,
      () => "session_123",
    );

    expect(plan).toEqual({ error: en.session.selectBasePlaylist });
  });

  it("creates direct launch and resume plans", () => {
    const directPlan = createDirectSessionStartPlan(
      {
        directPath: " /var/log/custom.log ",
        selectedPlaylistId: "playlist-1",
        selectedTrackId: null,
      },
      en,
      () => "direct_1",
    );

    expect(directPlan.input?.source).toBe("/var/log/custom.log");
    expect(directPlan.input?.label).toBe("custom.log");
    expect(directPlan.draft).toEqual({
      trackId: undefined,
      playlistId: "playlist-1",
    });

    const resumePlan = createResumeSessionPlan("session-1", [session], [repository], en);
    expect(resumePlan.error).toBeNull();
    expect(resumePlan.input).toEqual({
      sessionId: "session-1",
      adapterKind: "file",
      source: "/logs/production.log",
      label: "Night watch",
    });
  });

  it("resolves replay, readiness and placeholder state", () => {
    expect(resolveReplaySessionError(null, en)).toBe(en.session.noStoredSourceReplay);
    expect(resolveReplaySessionFailure(false, en)).toBe(en.session.failedReplay);
    expect(resolveReplayBookmarkError(false, en)).toBe(en.session.failedReplayJump);
    expect(
      buildSessionLabelPlaceholder({
        selectedBaseLabel: "Base Pulse",
        selectedSourceTitle: "production.log",
        templateGenre: "House",
        templateLabel: "Log monitor",
        fallbackLabel: en.session.sessionPlaceholder,
      }),
    ).toBe("production.log · Base Pulse · House");
    expect(resolvePlaybackPercent(0.401)).toBe(40);
    expect(
      resolveReadyToRun({
        baseMode: "track",
        selectedPlaylistId: null,
        selectedSourceId: "repo-1",
        selectedTrackId: "track-1",
      }),
    ).toBe(true);
  });

  it("resolves source options and timestamp ids deterministically", () => {
    const repoSource = {
      ...repository,
      id: "repo-2",
      sourceKind: "directory" as const,
    };

    expect(resolveSourceOptions("log", [repository, repoSource])).toEqual([repository]);
    expect(resolveSourceOptions("repo", [repository, repoSource])).toEqual([repoSource]);
    expect(createSessionTimestampId("session", 123)).toBe("session_123");
  });
});
