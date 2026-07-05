import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionSavedSessionCardActionsProps,
  buildSessionSavedSessionCardHeaderProps,
  buildSessionSavedSessionCardMetricsProps,
  buildSessionSavedSessionCardSections,
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

  it("builds card sections from the saved session contract", () => {
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
    const actions = resolveSessionSavedSessionCardActions({
      active: false,
      session,
      mutating: false,
    });
    const headerProps = buildSessionSavedSessionCardHeaderProps({
      session,
      selected: true,
      active: false,
      statusLabel: "Replay",
      statusTone: "status-paused",
      meta,
      t: en,
      onSelectSession: () => undefined,
    });
    const metricsProps = buildSessionSavedSessionCardMetricsProps({
      metrics,
      t: en,
    });
    const actionsProps = buildSessionSavedSessionCardActionsProps({
      session,
      mutating: false,
      actions,
      t: en,
      onResumeSession: () => undefined,
      onPlaybackSession: () => undefined,
      onDeleteSession: () => undefined,
    });
    const sections = buildSessionSavedSessionCardSections({
      t: en,
      session,
      selected: true,
      active: false,
      playbackActive: false,
      mutating: false,
      bookmarks: [{ id: 1 }] as never,
      liveWindowCount: 5,
      liveProcessedLines: 50,
      liveTotalAnomalies: 4,
      onSelectSession: () => undefined,
      onResumeSession: () => undefined,
      onPlaybackSession: () => undefined,
      onDeleteSession: () => undefined,
    });

    expect(headerProps.title).toBe("Night watch");
    expect(metricsProps.bpmLabel).toContain("126");
    expect(actionsProps.showPlaybackAction).toBe(true);
    expect(sections.headerProps.title).toBe("Night watch");
    expect(sections.metricsProps.anomaliesValue).toBe(2);
    expect(sections.actionsProps.showResumeAction).toBe(true);
    expect(sections.updatedAtLabel).toBeTruthy();
  });
});
