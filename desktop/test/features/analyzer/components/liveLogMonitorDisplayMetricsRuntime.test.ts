import { describe, expect, it } from "vitest";

import type { ActiveMonitorSession } from "../../../../src/features/monitor/monitorContextTypes";
import {
  buildMetricGridItems,
  resolveSessionCardDisplay,
} from "../../../../src/features/analyzer/components/liveLogMonitorDisplayRuntime";

const labels = {
  replaySessionTitle: "Replay session",
  sessionTitle: "Session",
  storedSourceReplay: "Stored source replay",
  fallbackDirectFilePoll: "Fallback - direct file poll",
  replayComplete: "complete",
  windowsReplayed: "{count} windows replayed",
  modeLabel: "Mode",
  audioEngineLabel: "Audio engine",
  styleProfileTitle: "Style profile",
  mutationProfileTitle: "Mutation profile",
  cueEngineLabel: "Cue engine",
  windowsHeardLabel: "Windows heard",
  cuesEmittedLabel: "Cues emitted",
  linesProcessedLabel: "Lines processed",
  anomaliesHeardLabel: "Anomalies heard",
  beatClockLabel: "Beat clock",
  freeLabel: "Free",
  voicesEmittedLabel: "Voices emitted",
  rhythmPulseLabel: "Rhythm pulse",
  activeLabel: "Active",
  offLabel: "Off",
} as const;

function createSession(
  overrides: Partial<ActiveMonitorSession> = {},
): ActiveMonitorSession {
  return {
    sessionId: "sess-1",
    persistedSessionId: "persisted-1",
    repoId: "repo-1",
    repoTitle: "visits-service",
    sourcePath: "/logs/visits-service.log",
    adapterKind: "file",
    pollMode: "session",
    startedAt: 1,
    ...overrides,
  };
}

describe("liveLogMonitorDisplayRuntime metrics/session helpers", () => {
  it("builds session card display for replay and live modes", () => {
    expect(
      resolveSessionCardDisplay({
        session: createSession(),
        replayActive: true,
        playbackPercent: 40,
        windowsHeard: 12,
        labels,
      }),
    ).toEqual({
      title: "Replay session",
      sourceSummary: "Stored source replay · /logs/visits-service.log",
      replayProgressSummary: "40% complete · 12 windows replayed",
    });

    expect(
      resolveSessionCardDisplay({
        session: createSession({ pollMode: "direct" }),
        replayActive: false,
        playbackPercent: null,
        windowsHeard: 3,
        labels,
      }),
    ).toEqual({
      title: "Session",
      sourceSummary: "Fallback - direct file poll",
      replayProgressSummary: null,
    });
  });

  it("builds metric grid items with replay and transport state", () => {
    const items = buildMetricGridItems({
      replayActive: true,
      replaySessionTitle: "Replay session",
      activeAdapterLabel: "File tail",
      audioStateLabel: "Active",
      styleProfileLabel: "Steady House",
      mutationProfileLabel: "Balanced",
      cueEngineStateLabel: "Sample pack",
      playbackWindowLabel: "3/12",
      windowsHeard: 12,
      cuesEmitted: 18,
      processedLines: 240,
      anomaliesHeard: 5,
      beatClockBpm: 126,
      voicesEmitted: 14,
      beatLooperActive: true,
      labels,
    });

    expect(items).toHaveLength(12);
    expect(items[0]).toEqual({ label: "Mode", value: "Replay session" });
    expect(items[5]).toEqual({ label: "Windows heard", value: "3/12" });
    expect(items[9]).toEqual({ label: "Beat clock", value: "126 BPM" });
    expect(items[11]).toEqual({ label: "Rhythm pulse", value: "Active" });
  });
});
