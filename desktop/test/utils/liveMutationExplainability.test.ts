import { describe, expect, it } from "vitest";

import {
  deriveLiveMutationExplanations,
  toLiveMutationVisualizationCues,
} from "../../src/utils/liveMutationExplainability";

describe("live mutation explainability", () => {
  it("links anomaly markers to routed cue mutations", () => {
    const explanations = deriveLiveMutationExplanations(
      [
        {
          id: "cue-1",
          eventIndex: 17,
          level: "error",
          component: "api",
          excerpt: "timeout threshold exceeded",
          noteHz: 440,
          durationMs: 240,
          gain: 0.28,
          waveform: "sawtooth",
          accent: "anomaly",
          routeKey: "anomaly",
          routeLabel: "Accent lane",
          stemLabel: "Alert stab",
          sectionLabel: "Impact cue",
          focus: "Push the anomaly to the front of the mix.",
        },
      ],
      [
        {
          eventIndex: 17,
          level: "error",
          component: "api",
          excerpt: "timeout threshold exceeded in /health",
        },
      ],
    );

    expect(explanations).toEqual([
      expect.objectContaining({
        id: "cue-1:17:api",
        eventIndex: 17,
        component: "api",
        level: "ERROR",
        trackId: null,
        trackTitle: null,
        trackSecond: null,
        triggerLabel: "Anomaly spike",
        triggerDetail: "timeout threshold exceeded in /health",
        resultLabel: "Accent lane → Alert stab",
        resultDetail: "Impact cue · Push the anomaly to the front of the mix.",
        routeKey: "anomaly",
        isAnomalyDriven: true,
      }),
    ]);
  });

  it("falls back to severity and cue excerpt when no marker is available", () => {
    const explanations = deriveLiveMutationExplanations(
      [
        {
          id: "cue-2",
          eventIndex: 18,
          level: "warn",
          component: "worker",
          excerpt: "queue depth rising",
          noteHz: 330,
          durationMs: 180,
          gain: 0.16,
          waveform: "triangle",
          accent: "steady",
          routeKey: "warn",
          routeLabel: "Pressure layer",
          stemLabel: "Warn pad",
          sectionLabel: "Build cue",
          focus: "Keep warning pressure audible without breaking the groove.",
        },
      ],
      [],
    );

    expect(explanations).toEqual([
      expect.objectContaining({
        triggerLabel: "Warning pressure",
        triggerDetail: "queue depth rising",
        resultLabel: "Pressure layer → Warn pad",
        routeKey: "warn",
        isAnomalyDriven: false,
      }),
    ]);
  });

  it("pins explanations to a base-track second and converts them into waveform cues", () => {
    const explanations = deriveLiveMutationExplanations(
      [
        {
          id: "cue-3",
          eventIndex: 19,
          level: "info",
          component: "scheduler",
          excerpt: "steady heartbeat",
          noteHz: 261.63,
          durationMs: 120,
          gain: 0.12,
          waveform: "sine",
          accent: "steady",
          routeKey: "info",
          routeLabel: "Base lane",
          stemLabel: "Pulse bed",
          sectionLabel: "Baseline cue",
          focus: "Keep the groove steady.",
        },
      ],
      [],
      {
        trackId: "track-1",
        trackTitle: "System Pulse",
        trackSecond: 42.375,
      },
    );

    expect(explanations).toEqual([
      expect.objectContaining({
        trackId: "track-1",
        trackTitle: "System Pulse",
        trackSecond: 42.375,
      }),
    ]);

    expect(toLiveMutationVisualizationCues(explanations)).toEqual([
      {
        second: 42.375,
        label: "E19",
        type: "info",
        excerpt: "scheduler · Info cadence → Base lane → Pulse bed",
      },
    ]);
  });
});
