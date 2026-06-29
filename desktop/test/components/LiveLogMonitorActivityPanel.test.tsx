import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveLogMonitorActivityPanel } from "../../src/features/analyzer/components/LiveLogMonitorActivityPanel";

describe("LiveLogMonitorActivityPanel", () => {
  const labels = {
    liveSystemRhythm: "Live system rhythm",
    liveSystemRhythmCopy: "Reactive monitoring view",
    awaitingSystemPulse: "Awaiting pulse",
    idleUpper: "IDLE",
    waveAnomalyMarkers: "Wave anomaly markers",
    noAnomalyMarkersLatestWindows: "No anomaly markers",
    waveSourceStream: "Wave source stream",
    streamTailSync: "Stream tail sync",
    syncTailAria: "Sync tail",
    waitingSynchronizedLines: "Waiting synchronized lines",
    anomalySourceLines: "Anomaly source lines",
    anomalySourceAria: "Anomaly source",
    noAnomalyProducingLine: "No anomaly producing line",
  } as const;

  it("renders waveform activity rows, anomaly markers and synchronized tail", () => {
    const syncTailListRef = createRef<HTMLDivElement>();

    render(
      <LiveLogMonitorActivityPanel
        waveform={<div>Waveform host</div>}
        recentCues={[
          {
            id: "cue-1",
            eventIndex: 1,
            component: "payments",
            excerpt: "error timeout",
            noteHz: 220,
            durationMs: 150,
            gain: 0.6,
            level: "error",
            waveform: "square",
            routeLabel: "alert",
            routeKey: "accent",
            stemLabel: "stem",
            sectionLabel: "phrase",
            accent: "anomaly",
            logLine: "error timeout",
            trackRole: "accent",
            timeOffsetMs: 0,
          },
        ]}
        waveAnomalyMarkers={[
          {
            eventIndex: 1,
            component: "payments",
            excerpt: "error timeout",
            level: "error",
          },
        ]}
        liveSourceLabel="/logs/payments.log"
        recentSyncTailRows={[
          {
            id: "row-1",
            windowId: "window-1",
            sourcePath: "/logs/payments.log",
            component: "payments",
            level: "error",
            line: "error timeout",
            tone: "anomaly",
          },
        ]}
        anomalySourceRows={[
          {
            sourcePath: "/logs/payments.log",
            component: "payments",
            level: "error",
            line: "error timeout",
            tone: "error",
          },
        ]}
        activeTailWindowId="window-1"
        syncTailListRef={syncTailListRef}
        isTropicalTheme={false}
        maxRecentCues={8}
        maxSyncTailLines={60}
        maxAnomalySourceLines={6}
        labels={labels}
      />,
    );

    expect(screen.getByText("Waveform host")).toBeTruthy();
    expect(screen.getByText("Live system rhythm")).toBeTruthy();
    expect(screen.getAllByText("/logs/payments.log").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/error timeout/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("list", { name: "Sync tail" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Anomaly source" })).toBeTruthy();
  });

  it("renders empty state labels when no activity exists", () => {
    const syncTailListRef = createRef<HTMLDivElement>();

    render(
      <LiveLogMonitorActivityPanel
        waveform={<div>Waveform host</div>}
        recentCues={[]}
        waveAnomalyMarkers={[]}
        liveSourceLabel="/logs/payments.log"
        recentSyncTailRows={[]}
        anomalySourceRows={[]}
        activeTailWindowId={null}
        syncTailListRef={syncTailListRef}
        isTropicalTheme
        maxRecentCues={8}
        maxSyncTailLines={60}
        maxAnomalySourceLines={6}
        labels={labels}
      />,
    );

    expect(screen.getByText("Awaiting pulse")).toBeTruthy();
    expect(screen.getByText("Waiting synchronized lines")).toBeTruthy();
    expect(screen.getByText("No anomaly producing line")).toBeTruthy();
  });
});
