import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LiveLogMonitorPerformanceSummary } from "../../src/features/analyzer/components/LiveLogMonitorPerformanceSummary";

describe("LiveLogMonitorPerformanceSummary", () => {
  const labels = {
    arrangementLayers: "Arrangement layers",
    arrangementLayersCopy: "Layered deck voices",
    noArrangementVoices: "No arrangement voices",
    padSequencerTitle: "Pad sequencer",
    padSequencerCopy: "Trigger previews",
    recentCuesTitle: "Recent cues",
    recentCuesCopy: "Latest engine cues",
    noLiveCues: "No live cues",
    recentAnomalyMarkersTitle: "Recent anomaly markers",
    recentAnomalyMarkersCopy: "Latest anomaly windows",
    eventLabel: "Event {index}",
    noAnomalyMarkersSession: "No anomaly markers",
    monitorNotesTitle: "Monitor notes",
    monitorNotesCopy: "Runtime annotations",
    runtimeError: "Runtime error",
    monitorNoteLabel: "Monitor note",
  } as const;

  it("renders arrangement, cues, markers and notes", () => {
    render(
      <LiveLogMonitorPerformanceSummary
        recentVoices={[
          {
            cue: {
              id: "cue-1",
              eventIndex: 1,
              component: "payments",
              excerpt: "timeout spike",
              noteHz: 220,
              durationMs: 120,
              gain: 0.6,
              level: "warn",
              waveform: "triangle",
              routeLabel: "monitor",
              routeKey: "warn",
              stemLabel: "stem",
              sectionLabel: "bridge",
              accent: "warn",
              logLine: "timeout spike",
              trackRole: "motion",
              timeOffsetMs: 0,
            },
            track: "motion",
            panOffset: 0,
            noteMultiplier: 1,
            gainMultiplier: 1,
            timeOffsetMs: 0,
          },
        ]}
        recentCues={[
          {
            id: "cue-1",
            eventIndex: 1,
            component: "payments",
            excerpt: "timeout spike",
            noteHz: 220,
            durationMs: 120,
            gain: 0.6,
            level: "warn",
            waveform: "triangle",
            routeLabel: "monitor",
            routeKey: "warn",
            stemLabel: "stem",
            sectionLabel: "bridge",
            accent: "warn",
            logLine: "timeout spike",
            trackRole: "motion",
            timeOffsetMs: 0,
          },
        ]}
        recentMarkers={[
          {
            eventIndex: 1,
            component: "payments",
            excerpt: "timeout spike",
            level: "warn",
          },
        ]}
        recentWarnings={["Buffer drift detected"]}
        error="Audio stalled"
        sequencerPanel={<div>Sequencer host</div>}
        labels={labels}
      />,
    );

    expect(screen.getByText("Arrangement layers")).toBeTruthy();
    expect(screen.getByText("payments · monitor")).toBeTruthy();
    expect(screen.getByText("Sequencer host")).toBeTruthy();
    expect(screen.getByText("Recent cues")).toBeTruthy();
    expect(screen.getByText("Recent anomaly markers")).toBeTruthy();
    expect(screen.getByText("Monitor notes")).toBeTruthy();
    expect(screen.getByText("Audio stalled")).toBeTruthy();
    expect(screen.getByText("Buffer drift detected")).toBeTruthy();
  });

  it("renders empty states when data is missing", () => {
    render(
      <LiveLogMonitorPerformanceSummary
        recentVoices={[]}
        recentCues={[]}
        recentMarkers={[]}
        recentWarnings={[]}
        error={null}
        sequencerPanel={<div>Sequencer host</div>}
        labels={labels}
      />,
    );

    expect(screen.getByText("No arrangement voices")).toBeTruthy();
    expect(screen.getByText("No live cues")).toBeTruthy();
    expect(screen.getByText("No anomaly markers")).toBeTruthy();
  });
});
