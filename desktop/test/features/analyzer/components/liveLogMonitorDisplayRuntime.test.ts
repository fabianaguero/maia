import { describe, expect, it } from "vitest";

import type { LiveLogMarker, LiveLogStreamUpdate } from "../../../../src/types/library";
import {
  buildLiveMonitorDisplayState,
  resolveAudioStateLabel,
  resolveBounceActionLabel,
  resolveCueEngineStateLabel,
} from "../../../../src/features/analyzer/components/liveLogMonitorDisplayRuntime";

function createMarker(overrides: Partial<LiveLogMarker> = {}): LiveLogMarker {
  return {
    eventIndex: 1,
    level: "ERROR",
    component: "payments",
    excerpt: "HTTP 500",
    ...overrides,
  };
}

function createUpdate(overrides: Partial<LiveLogStreamUpdate> = {}): LiveLogStreamUpdate {
  return {
    sourcePath: "/logs/live.log",
    fromOffset: 100,
    toOffset: 180,
    hasData: true,
    summary: "window",
    suggestedBpm: 126,
    confidence: 0.84,
    dominantLevel: "warn",
    lineCount: 4,
    anomalyCount: 1,
    levelCounts: { warn: 2, error: 1, info: 1 },
    anomalyMarkers: [createMarker()],
    topComponents: [],
    sonificationCues: [],
    parsedLines: ["INFO connected", "WARN retry in progress", "ERROR HTTP 500 while syncing"],
    warnings: [],
    replayWindowIndex: 2,
    ...overrides,
  };
}

const labels = {
  replayLabel: "Replay",
  liveLabel: "Live",
  stoppedLabel: "Stopped",
  audioUnavailable: "Unavailable",
  audioError: "Error",
  audioActive: "Active",
  audioArmed: "Armed",
  audioIdle: "Idle",
  audioOn: "Audio on",
  audioBlocked: "Audio blocked",
  cueEngineBaseSamplePack: "Sample pack",
  cueEngineBaseSample: "Sample",
  cueEngineLoadingSample: "Loading sample",
  cueEngineInternalSynth: "Synth",
} as const;

describe("liveLogMonitorDisplayRuntime", () => {
  it("resolves audio and cue engine labels", () => {
    expect(
      resolveAudioStateLabel({
        status: "ready",
        liveEnabled: true,
        labels,
      }),
    ).toBe("Active");
    expect(
      resolveCueEngineStateLabel({
        sampleStatus: "ready",
        sampleSourceCount: 2,
        labels,
      }),
    ).toBe("Sample pack");
    expect(resolveBounceActionLabel(3, 6)).toEqual({
      label: "↓ Bounce 18s",
      title: "Bounce 18s of session audio to WAV",
    });
  });

  it("builds live monitor display state slices and labels", () => {
    const state = buildLiveMonitorDisplayState({
      lastUpdate: createUpdate(),
      recentMarkers: [createMarker(), createMarker({ eventIndex: 2, excerpt: "WARN retry" })],
      syncTailRows: [
        {
          id: "a",
          windowId: "w1",
          sourcePath: "/logs/live.log",
          component: "payments",
          level: "error",
          line: "ERROR HTTP 500 while syncing",
          tone: "anomaly",
        },
        {
          id: "b",
          windowId: "w1",
          sourcePath: "/logs/live.log",
          component: "stream",
          level: "warn",
          line: "WARN retry in progress",
          tone: "warn",
        },
      ],
      maxSyncTailLines: 1,
      maxAnomalySourceLines: 4,
      replayActive: false,
      liveEnabled: true,
      repositorySourcePath: "/logs/fallback.log",
      audioStatus: "ready",
      labels,
    });

    expect(state.deckStatusLabel).toBe("Live");
    expect(state.audioStateLabel).toBe("Active");
    expect(state.audioBadgeLabel).toBe("Audio on");
    expect(state.audioBadgeTone).toBe("ready");
    expect(state.liveSourceLabel).toBe("/logs/live.log");
    expect(state.recentSyncTailRows).toHaveLength(1);
    expect(state.waveAnomalyMarkers).toHaveLength(2);
    expect(state.anomalySourceRows.length).toBeGreaterThan(0);
    expect(state.currentLevelCounts.error).toBe(1);
  });
});
