import { describe, expect, it } from "vitest";

import { en } from "../../../src/i18n/en";
import {
  buildSessionBoothViewModelCollections,
  buildSessionBoothViewModelState,
} from "../../../src/features/session/sessionBoothViewModelRuntime";
import type { BuildSessionBoothViewModelInput } from "../../../src/features/session/sessionBoothViewModel";

function buildInput(
  overrides: Partial<BuildSessionBoothViewModelInput> = {},
): BuildSessionBoothViewModelInput {
  return {
    t: en,
    mode: "log",
    latestUpdate: null,
    playbackActive: false,
    liveMonitorActive: false,
    readyToRun: false,
    playbackPercent: null,
    activeSession: null,
    selectedSourceTitle: null,
    selectedSourcePath: null,
    selectedSourceSuggestedBpm: null,
    selectedSessionSourceLabel: null,
    selectedSessionSourcePath: null,
    selectedBaseLabel: null,
    selectedBaseDetail: null,
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
    ...overrides,
  };
}

describe("sessionBoothViewModelRuntime", () => {
  it("builds booth state metadata for playback progress", () => {
    const state = buildSessionBoothViewModelState(
      buildInput({
        playbackActive: true,
        isPlaybackPaused: true,
        playbackPercent: 42,
        playbackEventIndex: 3,
        playbackEventCount: 12,
        activeSession: {
          id: "session-1",
          label: "Replay booth",
          sourceId: "source-1",
          sourceTitle: "customers-service",
          sourcePath: "/logs/customers.log",
          sourceKind: "file",
          trackId: null,
          trackTitle: null,
          playlistId: null,
          playlistName: null,
          adapterKind: "file",
          mode: "play",
          status: "paused",
          fileCursor: 0,
          totalPolls: 12,
          totalLines: 150,
          totalAnomalies: 4,
          lastBpm: 126,
          createdAt: "2026-06-25T00:00:00.000Z",
          updatedAt: "2026-06-25T00:00:00.000Z",
          sourceTemplateId: "deep-house",
        },
        selectedSessionSourceLabel: "customers-service",
        selectedSessionSourcePath: "/logs/customers.log",
        selectedSessionBaseLabel: "Night Ops",
        selectedSessionBaseDetail: "2 tracks · median 125 BPM",
      }),
    );

    expect(state.state.label).toBe(en.session.replayPaused);
    expect(state.headline).toBe("Replay booth");
    expect(state.progressAriaLabel).toBe(en.session.replayProgress);
    expect(state.progressWidth).toBe("42%");
    expect(state.stats[0]?.value).toBe("3/12");
  });

  it("builds live monitoring state metadata from latest update", () => {
    const state = buildSessionBoothViewModelState(
      buildInput({
        liveMonitorActive: true,
        readyToRun: true,
        selectedSourceTitle: "services",
        selectedSourcePath: "gcp-cloud-run://project/services",
        selectedBaseLabel: "Night Ops",
        selectedBaseDetail: "2 tracks · median 125 BPM",
        latestUpdate: {
          sourcePath: "gcp-cloud-run://project/services",
          fromOffset: 200,
          toOffset: 260,
          hasData: true,
          summary: "Live stream active",
          suggestedBpm: 128,
          confidence: 0.8,
          dominantLevel: "warn_spike",
          lineCount: 22,
          anomalyCount: 2,
          levelCounts: { info: 18, warn: 3, error: 1 },
          anomalyMarkers: [],
          topComponents: [],
          sonificationCues: [],
          parsedLines: [],
          warnings: [],
        },
        monitorMetrics: {
          windowCount: 6,
          processedLines: 144,
          totalAnomalies: 8,
        },
      }),
    );

    expect(state.state.label).toBe(en.session.liveHot);
    expect(state.summary).toBe("Live stream active");
    expect(state.progressAriaLabel).toBe(en.session.liveMonitoringActivity);
    expect(state.progressWidth).not.toBe("0%");
    expect(state.levelCountEntries).toEqual([
      ["info", 18],
      ["warn", 3],
      ["error", 1],
    ]);
  });

  it("slices booth collections deterministically", () => {
    const collections = buildSessionBoothViewModelCollections({
      sourcePath: "/logs/customers.log",
      fromOffset: 0,
      toOffset: 10,
      hasData: true,
      summary: "Window",
      suggestedBpm: 126,
      confidence: 0.5,
      dominantLevel: "info",
      lineCount: 10,
      anomalyCount: 6,
      levelCounts: { info: 10 },
      anomalyMarkers: Array.from({ length: 6 }, (_, index) => ({
        eventIndex: index,
        level: "warn",
        component: `component-${index}`,
        excerpt: `excerpt-${index}`,
      })),
      topComponents: Array.from({ length: 7 }, (_, index) => ({
        component: `component-${index}`,
        count: index + 1,
      })),
      sonificationCues: [],
      parsedLines: [],
      warnings: ["one", "two", "three", "four", "five"],
    });

    expect(collections.topComponents).toHaveLength(5);
    expect(collections.warningItems).toEqual(["one", "two", "three", "four"]);
    expect(collections.anomalyMarkers).toHaveLength(4);
    expect(collections.anomalyMarkers[0]?.component).toBe("component-0");
  });
});
