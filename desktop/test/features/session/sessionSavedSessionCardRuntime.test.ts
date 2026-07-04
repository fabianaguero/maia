import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionSavedSessionCardMetrics,
  resolveSessionSavedSessionCardActions,
  resolveSessionSavedSessionCardMeta,
  resolveSessionSavedSessionCardStatusLabel,
} from "../../../src/features/session/sessionSavedSessionCardRuntime";

const session = {
  id: "session-1",
  label: "Night watch",
  sourceId: "repo-1",
  sourceTitle: "production.log",
  sourceTemplateId: null,
  playlistName: null,
  trackTitle: "Base Pulse",
  totalPolls: 3,
  totalLines: 42,
  totalAnomalies: 2,
  lastBpm: 126,
  updatedAt: "2026-06-25T00:00:00.000Z",
  status: "paused",
} as never;

describe("sessionSavedSessionCardRuntime", () => {
  it("resolves status, metrics and meta for saved session cards", () => {
    const statusLabel = resolveSessionSavedSessionCardStatusLabel({
      session,
      playbackActive: false,
      t: en,
    });
    const metrics = buildSessionSavedSessionCardMetrics({
      session,
      active: false,
      playbackActive: false,
      liveWindowCount: 5,
      liveProcessedLines: 50,
      liveTotalAnomalies: 4,
      t: en,
    });
    const meta = resolveSessionSavedSessionCardMeta({
      session,
      bookmarks: [{ id: 1 }] as never,
      t: en,
    });

    expect(statusLabel).toBeTruthy();
    expect(metrics.pollsValue).toBe(3);
    expect(metrics.bpmLabel).toContain("126");
    expect(meta.title).toBe("Night watch");
    expect(meta.bookmarksLabel).toContain("1");
  });

  it("resolves action visibility and disabled states", () => {
    const actions = resolveSessionSavedSessionCardActions({
      active: false,
      session,
      mutating: false,
    });

    expect(actions.showPlaybackAction).toBe(true);
    expect(actions.showResumeAction).toBe(true);
    expect(actions.deleteDisabled).toBe(false);
  });
});
