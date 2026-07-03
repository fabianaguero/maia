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

  it("falls back to idle/random shaping when no cues or anomalies are present", () => {
    const seed = createMonitorSignalBuffer(120, { val: 22, heat: 0.4 });

    const activeBuffer = advanceActiveLogSignalBuffer({
      previous: seed,
      cueBatch: [],
      anomalyMarkers: [],
      reactivityMix: 0.2,
      anomalyMix: 0.1,
      randomValue: 0.5,
    });
    const idleBuffer = advanceIdleLogSignalBuffer({
      previous: seed,
      nowMs: 2_500,
      idleMix: 0.4,
      effectiveBpm: null,
    });
    const simulatedInfo = advanceSimulatedLogSignalBuffer(seed, "info");

    expect(activeBuffer[60]?.val).toBeGreaterThan(20);
    expect(activeBuffer[60]?.heat).toBeLessThan(0.4);
    expect(idleBuffer[60]?.val).toBeGreaterThan(0);
    expect(idleBuffer[60]?.heat).toBeLessThan(seed[60]!.heat);
    expect(simulatedInfo[60]).toEqual({ val: 40, heat: 0 });
  });

  it("derives active heat from anomaly markers even when no cue batch is present", () => {
    const seed = createMonitorSignalBuffer(120, { val: 20, heat: 0 });
    const anomalyOnlyBuffer = advanceActiveLogSignalBuffer({
      previous: seed,
      cueBatch: [],
      anomalyMarkers: [
        {
          eventIndex: 1,
          level: "warn",
          component: "orders",
          excerpt: "warning",
        },
      ],
      reactivityMix: 0.6,
      anomalyMix: 0.9,
    });

    expect(anomalyOnlyBuffer[60]?.val).toBeCloseTo(20, 0);
    expect(anomalyOnlyBuffer[60]?.heat).toBeGreaterThan(0);
  });

  it("keeps active heat at zero when cues exist without anomaly markers", () => {
    const seed = createMonitorSignalBuffer(120, { val: 20, heat: 0.2 });
    const cueOnlyBuffer = advanceActiveLogSignalBuffer({
      previous: seed,
      cueBatch: [
        {
          id: "cue-only",
          eventIndex: 1,
          level: "info",
          component: "orders",
          excerpt: "cue only",
          gain: 0.2,
        },
      ],
      anomalyMarkers: [],
      reactivityMix: 0.5,
      anomalyMix: 0.5,
    });

    expect(cueOnlyBuffer[60]?.val).toBeGreaterThan(20);
    expect(cueOnlyBuffer[60]?.heat).toBeLessThan(seed[60]!.heat);
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

  it("suppresses cue accents when the update is not meaningful, the burst is too dense, or cooldown is active", () => {
    const tooBursted = shouldEmitMonitorCueAccent({
      update: {
        ...baseUpdate,
        anomalyCount: 3,
        lineCount: 3,
        anomalyMarkers: new Array(12).fill(baseUpdate.anomalyMarkers[0]),
      },
      cueBatch: baseUpdate.sonificationCues,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      hasMeaningfulUpdate: true,
      hasBackgroundTrack: false,
      lastCueAccentAtMs: 0,
      nowMs: 1,
    });
    const onCooldown = shouldEmitMonitorCueAccent({
      update: baseUpdate,
      cueBatch: baseUpdate.sonificationCues,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      hasMeaningfulUpdate: true,
      hasBackgroundTrack: true,
      lastCueAccentAtMs: 1000,
      nowMs: 1000 + DEFAULT_MONITOR_DECK_CONTROLS.cueCooldownMs - 1,
    });
    const noMeaningfulUpdate = shouldEmitMonitorCueAccent({
      update: baseUpdate,
      cueBatch: baseUpdate.sonificationCues,
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      hasMeaningfulUpdate: false,
      hasBackgroundTrack: false,
      lastCueAccentAtMs: 0,
      nowMs: 1,
    });

    expect(tooBursted).toBe(false);
    expect(onCooldown).toBe(false);
    expect(noMeaningfulUpdate).toBe(false);
  });

  it("uses fallback cue detection by gain and suppresses output when no qualifying cue exists", () => {
    const gainDriven = shouldEmitMonitorCueAccent({
      update: {
        ...baseUpdate,
        anomalyCount: 0,
        lineCount: 2,
        levelCounts: { error: 1, info: 1 },
      },
      cueBatch: [
        {
          id: "cue-gain",
          eventIndex: 1,
          level: "error",
          component: "orders",
          excerpt: "error",
          gain: 0.15,
        },
      ],
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      hasMeaningfulUpdate: true,
      hasBackgroundTrack: false,
      lastCueAccentAtMs: 0,
      nowMs: 1,
    });
    const noCue = shouldEmitMonitorCueAccent({
      update: {
        ...baseUpdate,
        anomalyCount: 1,
        lineCount: 2,
        levelCounts: { warn: 1, info: 1 },
      },
      cueBatch: [
        {
          id: "cue-low",
          eventIndex: 1,
          level: "warn",
          component: "orders",
          excerpt: "warn",
          gain: 0.05,
        },
      ],
      controls: DEFAULT_MONITOR_DECK_CONTROLS,
      hasMeaningfulUpdate: true,
      hasBackgroundTrack: false,
      lastCueAccentAtMs: 0,
      nowMs: 1,
    });

    expect(gainDriven).toBe(true);
    expect(noCue).toBe(false);
  });
});
