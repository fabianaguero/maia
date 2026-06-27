import { describe, expect, it } from "vitest";

import type { LibraryTrack } from "../../../src/types/library";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";
import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import type { MonitorLogLine } from "../../../src/features/simple/monitorLogParsing";
import {
  advanceActiveLogSignalBuffer,
  advanceIdleLogSignalBuffer,
  advanceSimulatedLogSignalBuffer,
  buildMonitorBootstrapLine,
  buildMonitorLiveStreamHookState,
  buildMonitorLiveStreamResetState,
  buildSimulatedMonitorLogLine,
  buildWaveformAnomalyMarkers,
  createMonitorSignalBuffer,
  resolveInitialSelectedAnomalyId,
  resolveMonitorWaveContext,
  sanitizeLiveLogStreamUpdate,
  shouldEmitMonitorCueAccent,
} from "../../../src/features/simple/monitorLiveStreamRuntime";

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
  parsedLines: [
    "INFO 2026-06-24T21:11:36.467853Z HTTP Request: GET https://example.com \"HTTP/1.1 200 OK\"",
    "WARNING 2026-06-24T21:11:38.209845Z Timeout while reading upstream response",
  ],
  warnings: [],
};

const anomalyLines: MonitorLogLine[] = [
  {
    id: "line-1",
    timestamp: "2026-06-24 18:11:36",
    level: "warn",
    message: "Timeout while reading upstream response",
    isAnomaly: true,
    anomalyId: "anom-1",
  },
  {
    id: "line-2",
    timestamp: "2026-06-24 18:11:38",
    level: "error",
    message: "HTTP 500 on /webhooks/log",
    isAnomaly: true,
    anomalyId: "anom-2",
  },
];

const track = {
  beatGrid: [],
  analysis: {
    beatGrid: [],
    bpm: 126,
  },
} as LibraryTrack;

describe("monitorLiveStreamRuntime", () => {
  it("builds bootstrap tail lines for live monitoring", () => {
    const line = buildMonitorBootstrapLine({
      sessionSourcePath: "/logs/visits-service.log",
      streamAdapterLabel: "FILE_TAIL",
      now: new Date("2026-06-26T10:15:00.000Z"),
    });

    expect(line.id).toBe("maia-monitor-init");
    expect(line.level).toBe("info");
    expect(line.message).toContain("FILE_TAIL armed");
    expect(line.message).toContain("visits-service.log");
  });

  it("creates fresh signal buffers", () => {
    const buffer = createMonitorSignalBuffer(4, { val: 12, heat: 0.2 });

    expect(buffer).toEqual([
      { val: 12, heat: 0.2 },
      { val: 12, heat: 0.2 },
      { val: 12, heat: 0.2 },
      { val: 12, heat: 0.2 },
    ]);
    expect(buffer[0]).not.toBe(buffer[1]);
  });

  it("builds reset and hook state snapshots for the live stream hook", () => {
    const resetState = buildMonitorLiveStreamResetState();
    const setSelectedAnomalyId = () => undefined;
    const simulateLog = () => undefined;
    const hookState = buildMonitorLiveStreamHookState({
      ...resetState,
      setSelectedAnomalyId,
      simulateLog,
    });

    expect(resetState.liveLines).toEqual([]);
    expect(resetState.waveformAnomalies).toEqual([]);
    expect(resetState.selectedAnomalyId).toBeNull();
    expect(resetState.liveSuggestedBpm).toBeNull();
    expect(resetState.logSignalBuffer).toHaveLength(120);
    expect(hookState.setSelectedAnomalyId).toBe(setSelectedAnomalyId);
    expect(hookState.simulateLog).toBe(simulateLog);
    expect(hookState.logSignalBuffer).toBe(resetState.logSignalBuffer);
  });

  it("sanitizes stream updates conservatively", () => {
    const sanitized = sanitizeLiveLogStreamUpdate(baseUpdate);

    expect(sanitized.parsedLines).toHaveLength(2);
    expect(sanitized.cueBatch).toHaveLength(1);
    expect(sanitized.anomalyMarkers).toHaveLength(1);
    expect(sanitized.hasRealLines).toBe(true);
    expect(sanitized.hasRealSignals).toBe(true);
    expect(sanitized.hasMeaningfulUpdate).toBe(true);
    expect(sanitized.suggestedBpm).toBe(126);
  });

  it("resolves wave context and initial anomaly focus deterministically", () => {
    const waveContext = resolveMonitorWaveContext({
      activeAudio: { duration: 240, currentTime: 60 } as Pick<HTMLAudioElement, "duration" | "currentTime">,
      fallbackDurationSeconds: 200,
      fallbackProgress: 0.1,
      liveSuggestedBpm: 128,
      trackBpm: 126,
    });

    expect(waveContext.durationSeconds).toBe(240);
    expect(waveContext.currentProgress).toBe(0.25);
    expect(waveContext.bpm).toBe(128);
    expect(resolveInitialSelectedAnomalyId(null, anomalyLines)).toBe("anom-1");
    expect(resolveInitialSelectedAnomalyId("persisted-anomaly", anomalyLines)).toBe(
      "persisted-anomaly",
    );
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

  it("builds waveform anomaly markers on the current progress grid", () => {
    const markers = buildWaveformAnomalyMarkers({
      previous: [{ id: "keep", lineId: "keep", timestamp: "00:10", message: "keep", severity: 0.5, progress: 0.2 }],
      parsedLines: anomalyLines,
      currentTrack: track,
      durationSeconds: 320,
      bpm: 126,
      currentProgress: 0.35,
      beatSnapSubdivision: DEFAULT_MONITOR_DECK_CONTROLS.beatSnapSubdivision,
    });

    expect(markers).toHaveLength(3);
    expect(markers[0]?.id).toBe("keep");
    expect(markers[1]?.severity).toBe(0.72);
    expect(markers[2]?.severity).toBe(1);
    expect(markers[1]?.progress).toBeGreaterThanOrEqual(0.35);
  });

  it("advances active and idle buffers deterministically", () => {
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

    expect(activeBuffer).toHaveLength(120);
    expect(activeBuffer[60]?.val).toBeGreaterThan(20);
    expect(activeBuffer[60]?.heat).toBeGreaterThan(0);
    expect(idleBuffer).toHaveLength(120);
    expect(idleBuffer[60]?.val).not.toBe(20);
    expect(idleBuffer[60]?.heat).toBeGreaterThanOrEqual(0);
  });

  it("builds simulated monitor bursts consistently", () => {
    const simulated = buildSimulatedMonitorLogLine({
      nowMs: 1234,
      randomValue: 0.6,
      now: new Date("2026-06-26T10:20:00.000Z"),
    });
    const buffer = advanceSimulatedLogSignalBuffer(createMonitorSignalBuffer(), simulated.level);

    expect(simulated.id).toBe("sim-1234");
    expect(simulated.isAnomaly).toBe(true);
    expect(simulated.anomalyId).toBe("sim-anomaly-1234");
    expect(buffer[60]?.heat).toBeGreaterThan(0);
    expect(buffer[60]?.val).toBeGreaterThan(40);
  });
});
