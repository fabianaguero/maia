import { describe, expect, it } from "vitest";
import { en } from "../../../src/i18n/en";
import { buildSessionBoothViewModel } from "../../../src/features/session/sessionBoothViewModel";

describe("sessionBoothViewModel", () => {
  it("builds an armed idle booth when source and bed are ready but monitoring is not live", () => {
    const booth = buildSessionBoothViewModel({
      t: en,
      mode: "log",
      latestUpdate: null,
      playbackActive: false,
      liveMonitorActive: false,
      readyToRun: true,
      playbackPercent: null,
      activeSession: null,
      selectedSourceTitle: "customers-service",
      selectedSourcePath: "/logs/customers-service.log",
      selectedSourceSuggestedBpm: 124,
      selectedSessionSourceLabel: null,
      selectedSessionSourcePath: null,
      selectedBaseLabel: "Night Ops",
      selectedBaseDetail: "2 tracks · median 125 BPM",
      selectedSessionBaseLabel: null,
      selectedSessionBaseDetail: null,
      activeBaseLabel: null,
      activeBaseDetail: null,
      activeSourceLabel: null,
      activeSourcePath: null,
      monitorSession: null,
      monitorMetrics: {
        windowCount: 0,
        processedLines: 0,
        totalAnomalies: 0,
      },
      isPlaybackPaused: false,
      playbackEventIndex: null,
      playbackEventCount: null,
    });

    expect(booth.state.label).toBe(en.session.boothArmed);
    expect(booth.headline).toBe("customers-service");
    expect(booth.summary).toBe(en.session.baseAndSourceArmed);
    expect(booth.adapterLabel).toBe(en.session.logFile);
    expect(booth.signalBpm).toBe(124);
  });

  it("builds a live booth from the latest streaming update", () => {
    const booth = buildSessionBoothViewModel({
      t: en,
      mode: "log",
      latestUpdate: {
        sourcePath: "/logs/live.log",
        fromOffset: 0,
        toOffset: 100,
        hasData: true,
        summary: "Window captured",
        suggestedBpm: 128,
        confidence: 0.82,
        dominantLevel: "warn_spike",
        lineCount: 32,
        anomalyCount: 4,
        levelCounts: { info: 20, warn: 10, error: 2 },
        anomalyMarkers: [
          { eventIndex: 0, level: "error", component: "checkout", excerpt: "timeout" },
        ],
        topComponents: [{ component: "checkout", count: 12 }],
        sonificationCues: [],
        parsedLines: ["timeout in checkout"],
        warnings: ["burst detected"],
      },
      playbackActive: false,
      liveMonitorActive: true,
      readyToRun: true,
      playbackPercent: null,
      activeSession: {
        id: "session-1",
        label: "customers-service",
        sourceId: "repo-1",
        sourceTitle: "customers-service",
        sourcePath: "/logs/live.log",
        sourceKind: "file",
        trackId: null,
        trackTitle: null,
        playlistId: null,
        playlistName: null,
        adapterKind: "file",
        mode: "live",
        status: "active",
        fileCursor: 100,
        totalPolls: 12,
        totalLines: 400,
        totalAnomalies: 7,
        lastBpm: 127,
        createdAt: "2026-06-25T00:00:00.000Z",
        updatedAt: "2026-06-25T00:00:00.000Z",
        sourceTemplateId: "deep-house",
      },
      selectedSourceTitle: null,
      selectedSourcePath: null,
      selectedSourceSuggestedBpm: null,
      selectedSessionSourceLabel: null,
      selectedSessionSourcePath: null,
      selectedBaseLabel: null,
      selectedBaseDetail: null,
      selectedSessionBaseLabel: null,
      selectedSessionBaseDetail: null,
      activeBaseLabel: "Night Ops",
      activeBaseDetail: "2 tracks · median 125 BPM",
      activeSourceLabel: "customers-service",
      activeSourcePath: "/logs/live.log",
      monitorSession: {
        sessionId: "runtime-1",
        persistedSessionId: "session-1",
        repoId: "repo-1",
        repoTitle: "customers-service",
        trackName: "Night Ops",
        sourcePath: "/logs/live.log",
        adapterKind: "file",
        sourceTemplateId: "deep-house",
        startedAt: Date.now(),
      },
      monitorMetrics: {
        windowCount: 9,
        processedLines: 220,
        totalAnomalies: 11,
      },
      isPlaybackPaused: false,
      playbackEventIndex: null,
      playbackEventCount: null,
    });

    expect(booth.state.label).toBe(en.session.liveHot);
    expect(booth.summary).toBe("Window captured");
    expect(booth.levelCountEntries).toEqual([
      ["info", 20],
      ["warn", 10],
      ["error", 2],
    ]);
    expect(booth.topComponents[0]?.component).toBe("checkout");
    expect(booth.warningItems[0]).toBe("burst detected");
    expect(booth.progressAriaLabel).toBe(en.session.liveMonitoringActivity);
  });

  it("builds replay stats when playback is active", () => {
    const booth = buildSessionBoothViewModel({
      t: en,
      mode: "log",
      latestUpdate: null,
      playbackActive: true,
      liveMonitorActive: false,
      readyToRun: false,
      playbackPercent: 64,
      activeSession: {
        id: "session-2",
        label: "replay session",
        sourceId: "repo-1",
        sourceTitle: "customers-service",
        sourcePath: "/logs/live.log",
        sourceKind: "file",
        trackId: null,
        trackTitle: null,
        playlistId: null,
        playlistName: null,
        adapterKind: "file",
        mode: "play",
        status: "paused",
        fileCursor: 100,
        totalPolls: 20,
        totalLines: 600,
        totalAnomalies: 15,
        lastBpm: 126,
        createdAt: "2026-06-25T00:00:00.000Z",
        updatedAt: "2026-06-25T00:00:00.000Z",
        sourceTemplateId: "deep-house",
      },
      selectedSourceTitle: null,
      selectedSourcePath: null,
      selectedSourceSuggestedBpm: null,
      selectedSessionSourceLabel: "customers-service",
      selectedSessionSourcePath: "/logs/live.log",
      selectedBaseLabel: null,
      selectedBaseDetail: null,
      selectedSessionBaseLabel: "Night Ops",
      selectedSessionBaseDetail: "2 tracks · median 125 BPM",
      activeBaseLabel: null,
      activeBaseDetail: null,
      activeSourceLabel: null,
      activeSourcePath: null,
      monitorSession: null,
      monitorMetrics: {
        windowCount: 0,
        processedLines: 0,
        totalAnomalies: 0,
      },
      isPlaybackPaused: true,
      playbackEventIndex: 8,
      playbackEventCount: 20,
    });

    expect(booth.state.label).toBe(en.session.replayPaused);
    expect(booth.headline).toBe("replay session");
    expect(booth.progressAriaLabel).toBe(en.session.replayProgress);
    expect(booth.stats[0]).toEqual({
      label: en.session.replay,
      value: "8/20",
      helper: en.session.windows,
    });
    expect(booth.progressWidth).toBe("64%");
  });
});
