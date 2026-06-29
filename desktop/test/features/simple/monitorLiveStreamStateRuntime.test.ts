import { describe, expect, it } from "vitest";

import type { LibraryTrack } from "../../../src/types/library";
import type { LiveLogStreamUpdate } from "../../../src/types/monitor";
import type { MonitorLogLine } from "../../../src/features/simple/monitorLogParsing";
import { DEFAULT_MONITOR_DECK_CONTROLS } from "../../../src/features/simple/monitorDeckControls";
import {
  buildMonitorBootstrapLine,
  buildMonitorLiveStreamHookState,
  buildMonitorLiveStreamResetState,
  buildSimulatedMonitorLogLine,
  buildWaveformAnomalyMarkers,
  resolveInitialSelectedAnomalyId,
  resolveMonitorWaveContext,
  sanitizeLiveLogStreamUpdate,
} from "../../../src/features/simple/monitorLiveStreamStateRuntime";

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
    'INFO 2026-06-24T21:11:36.467853Z HTTP Request: GET https://example.com "HTTP/1.1 200 OK"',
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

describe("monitorLiveStreamStateRuntime", () => {
  it("builds bootstrap, reset and hook state snapshots", () => {
    const line = buildMonitorBootstrapLine({
      sessionSourcePath: "/logs/visits-service.log",
      streamAdapterLabel: "FILE_TAIL",
      now: new Date("2026-06-26T10:15:00.000Z"),
    });
    const resetState = buildMonitorLiveStreamResetState();
    const setSelectedAnomalyId = () => undefined;
    const simulateLog = () => undefined;
    const hookState = buildMonitorLiveStreamHookState({
      ...resetState,
      setSelectedAnomalyId,
      simulateLog,
    });

    expect(line.message).toContain("FILE_TAIL armed");
    expect(resetState.logSignalBuffer).toHaveLength(120);
    expect(hookState.setSelectedAnomalyId).toBe(setSelectedAnomalyId);
    expect(hookState.simulateLog).toBe(simulateLog);
  });

  it("sanitizes updates and resolves waveform/anomaly state deterministically", () => {
    const sanitized = sanitizeLiveLogStreamUpdate(baseUpdate);
    const waveContext = resolveMonitorWaveContext({
      activeAudio: { duration: 240, currentTime: 60 } as Pick<
        HTMLAudioElement,
        "duration" | "currentTime"
      >,
      fallbackDurationSeconds: 200,
      fallbackProgress: 0.1,
      liveSuggestedBpm: 128,
      trackBpm: 126,
    });
    const markers = buildWaveformAnomalyMarkers({
      previous: [
        {
          id: "keep",
          lineId: "keep",
          timestamp: "00:10",
          message: "keep",
          severity: 0.5,
          progress: 0.2,
        },
      ],
      parsedLines: anomalyLines,
      currentTrack: track,
      durationSeconds: 320,
      bpm: 126,
      currentProgress: 0.35,
      beatSnapSubdivision: DEFAULT_MONITOR_DECK_CONTROLS.beatSnapSubdivision,
    });
    const simulated = buildSimulatedMonitorLogLine({
      nowMs: 1234,
      randomValue: 0.6,
      now: new Date("2026-06-26T10:20:00.000Z"),
    });

    expect(sanitized.hasMeaningfulUpdate).toBe(true);
    expect(waveContext.currentProgress).toBe(0.25);
    expect(resolveInitialSelectedAnomalyId(null, anomalyLines)).toBe("anom-1");
    expect(markers).toHaveLength(3);
    expect(simulated.anomalyId).toBe("sim-anomaly-1234");
  });
});
