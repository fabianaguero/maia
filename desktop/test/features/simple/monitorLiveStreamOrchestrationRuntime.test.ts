import { describe, expect, it } from "vitest";

import type { LibraryTrack } from "../../../src/types/library";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";
import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import {
  buildMonitorLiveStreamIdleState,
  buildMonitorLiveStreamUpdateState,
  buildSimulatedMonitorState,
} from "../../../src/features/simple/monitorLiveStreamOrchestrationRuntime";
import { createMonitorSignalBuffer } from "../../../src/features/simple/monitorLiveStreamRuntime";

const track = {
  analysis: {
    beatGrid: [],
    bpm: 126,
  },
  beatGrid: [],
} as LibraryTrack;

function createUpdate(overrides: Partial<LiveLogStreamUpdate> = {}): LiveLogStreamUpdate {
  return {
    sourcePath: "/logs/visits-service.log",
    fromOffset: 0,
    toOffset: 128,
    hasData: true,
    summary: "tail active",
    suggestedBpm: 126,
    confidence: 0.82,
    dominantLevel: "warn",
    lineCount: 2,
    anomalyCount: 1,
    levelCounts: { info: 1, warn: 1 },
    anomalyMarkers: [
      {
        eventIndex: 1,
        level: "warn",
        component: "visits-service",
        excerpt: "Timeout while reading upstream response",
      },
    ],
    topComponents: [{ component: "visits-service", count: 2 }],
    sonificationCues: [
      {
        id: "cue-1",
        eventIndex: 1,
        level: "warn",
        component: "visits-service",
        excerpt: "Timeout while reading upstream response",
        noteHz: 220,
        durationMs: 140,
        gain: 0.16,
        waveform: "triangle",
        accent: "anomaly",
      },
    ],
    parsedLines: [
      "INFO 2026-06-24T21:11:36.467853Z app boot complete",
      "WARN 2026-06-24T21:11:38.209845Z Timeout while reading upstream response",
    ],
    warnings: [],
    ...overrides,
  };
}

describe("monitorLiveStreamOrchestrationRuntime", () => {
  it("builds the next live stream state from an incoming update", () => {
    const state = buildMonitorLiveStreamUpdateState({
      update: createUpdate(),
      currentTrack: track,
      activeAudio: {
        duration: 240,
        currentTime: 60,
      } as Pick<HTMLAudioElement, "duration" | "currentTime">,
      fallbackDurationSeconds: 200,
      fallbackProgress: 0.1,
      liveSuggestedBpm: 128,
      selectedAnomalyId: null,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      maxLiveLines: 8,
      previousLiveLines: [],
      previousWaveformAnomalies: [],
      previousLogSignalBuffer: createMonitorSignalBuffer(),
    });

    expect(state.normalizedUpdate.hasMeaningfulUpdate).toBe(true);
    expect(state.nextLiveSuggestedBpm).toBe(126);
    expect(state.nextLiveLines).toHaveLength(2);
    expect(state.nextWaveformAnomalies.length).toBeGreaterThan(0);
    expect(state.nextSelectedAnomalyId).not.toBeNull();
    expect(state.nextLogSignalBuffer[60]?.val).toBeGreaterThan(20);
  });

  it("keeps idle state stable before the idle hold and advances it after", () => {
    const previous = createMonitorSignalBuffer(120, { val: 20, heat: 0 });

    const held = buildMonitorLiveStreamIdleState({
      previous,
      nowMs: 1000,
      idleForMs: 200,
      idleHoldMs: 300,
      idleMix: 0.4,
      effectiveBpm: 126,
    });
    const advanced = buildMonitorLiveStreamIdleState({
      previous,
      nowMs: 1000,
      idleForMs: 500,
      idleHoldMs: 300,
      idleMix: 0.4,
      effectiveBpm: 126,
    });

    expect(held).toBe(previous);
    expect(advanced).not.toBe(previous);
    expect(advanced[60]?.val).not.toBe(previous[60]?.val);
  });

  it("builds simulated live tail state consistently", () => {
    const previousBuffer = createMonitorSignalBuffer();
    const nextState = buildSimulatedMonitorState({
      nowMs: 1234,
      previousLiveLines: [],
      previousLogSignalBuffer: previousBuffer,
      randomValue: 0.6,
    });

    expect(nextState.mock.id).toBe("sim-1234");
    expect(nextState.nextLiveLines[0]?.isAnomaly).toBe(true);
    expect(nextState.nextLogSignalBuffer[60]?.heat).toBeGreaterThan(0);
  });
});
