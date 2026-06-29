import { describe, expect, it } from "vitest";

import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";
import {
  advanceActiveLogSignalBuffer,
  advanceIdleLogSignalBuffer,
  advanceSimulatedLogSignalBuffer,
  createMonitorSignalBuffer,
  shouldEmitMonitorCueAccent,
} from "../../../src/features/simple/monitorLiveStreamSignalRuntime";

const baseUpdate: LiveLogStreamUpdate = {
  sourcePath: "/tmp/visits-service.log",
  fromOffset: 0,
  toOffset: 128,
  hasData: true,
  summary: "2 lines",
  suggestedBpm: 126,
  confidence: 0.72,
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
  topComponents: [],
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
  parsedLines: [],
  warnings: [],
};

describe("monitorLiveStreamSignalRuntime", () => {
  it("creates and advances signal buffers deterministically", () => {
    const seed = createMonitorSignalBuffer(120, { val: 20, heat: 0 });
    const activeBuffer = advanceActiveLogSignalBuffer({
      previous: seed,
      cueBatch: baseUpdate.sonificationCues,
      anomalyMarkers: baseUpdate.anomalyMarkers,
      reactivityMix: 0.72,
      anomalyMix: 0.68,
    });
    const idleBuffer = advanceIdleLogSignalBuffer({
      previous: seed,
      nowMs: 1_000,
      idleMix: 0.34,
      effectiveBpm: 126,
    });
    const simulated = advanceSimulatedLogSignalBuffer(seed, "warn");

    expect(activeBuffer[60]?.val).toBeGreaterThan(20);
    expect(activeBuffer[60]?.heat).toBeGreaterThan(0);
    expect(idleBuffer[60]?.val).not.toBe(20);
    expect(simulated[60]?.heat).toBeGreaterThan(0);
  });

  it("emits cue accents only when anomaly pressure and cooldown allow it", () => {
    const shouldEmit = shouldEmitMonitorCueAccent({
      update: baseUpdate,
      cueBatch: baseUpdate.sonificationCues,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      hasMeaningfulUpdate: true,
      hasBackgroundTrack: true,
      lastCueAccentAtMs: 0,
      nowMs: DEFAULT_MONITOR_DECK_CONTROLS.cueCooldownMs + 10,
    });
    const shouldSuppress = shouldEmitMonitorCueAccent({
      update: {
        ...baseUpdate,
        anomalyCount: 0,
        lineCount: 12,
        levelCounts: { info: 12 },
      },
      cueBatch: baseUpdate.sonificationCues,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      hasMeaningfulUpdate: true,
      hasBackgroundTrack: true,
      lastCueAccentAtMs: DEFAULT_MONITOR_DECK_CONTROLS.cueCooldownMs,
      nowMs: DEFAULT_MONITOR_DECK_CONTROLS.cueCooldownMs + 100,
    });

    expect(shouldEmit).toBe(true);
    expect(shouldSuppress).toBe(false);
  });
});
