import { describe, expect, it } from "vitest";

import {
  buildCuePlaybackPlan,
  resolveCuePlaybackEngine,
  resolveExternalCueLayerVolume,
} from "../../src/features/analyzer/components/liveLogMonitorCuePlaybackRuntime";
import type { RoutedLiveCue } from "../../src/features/analyzer/components/liveSonificationScene";

function cue(overrides: Partial<RoutedLiveCue> = {}): RoutedLiveCue {
  return {
    component: "api",
    level: "INFO",
    routeKey: "info",
    eventIndex: 0,
    noteHz: 220,
    gain: 0.2,
    pan: 0,
    waveform: "sine",
    durationMs: 120,
    accent: "none",
    samplePath: null,
    sourceLine: "line",
    excerpt: null,
    mutationTag: null,
    ...overrides,
  } as RoutedLiveCue;
}

describe("liveLogMonitorCuePlaybackRuntime", () => {
  it("builds restrained playback cues when mutating a guide track", () => {
    const plan = buildCuePlaybackPlan({
      cues: [cue(), cue({ routeKey: "error", level: "ERROR", eventIndex: 1 })],
      arrangementDepth: "full",
      maxCuesPerWindow: 8,
      hasGuideTrackMutation: true,
      effectiveLiveMutationState: "warning",
    });

    expect(plan.preferGuideTrackMutation).toBe(true);
    expect(plan.allowExternalCueLayer).toBe(false);
    expect(plan.voicedCues.length).toBeGreaterThan(0);
    expect(plan.audibleVoiceEntriesForPlayback.every((entry) => entry.voicedCue.gain <= 0.08)).toBe(
      true,
    );
  });

  it("keeps external cue layer open in non-guide mode and resolves volume", () => {
    const plan = buildCuePlaybackPlan({
      cues: [cue({ routeKey: "warn", level: "WARN" })],
      arrangementDepth: "minimal",
      maxCuesPerWindow: 2,
      hasGuideTrackMutation: false,
      effectiveLiveMutationState: "normal",
    });

    expect(plan.allowExternalCueLayer).toBe(true);
    expect(resolveExternalCueLayerVolume({ preferGuideTrackMutation: false, masterVolume: 0.5 })).toBe(
      0.675,
    );
    expect(resolveExternalCueLayerVolume({ preferGuideTrackMutation: false, masterVolume: 0.05 })).toBe(
      0.22,
    );
    expect(resolveExternalCueLayerVolume({ preferGuideTrackMutation: false, masterVolume: 2 })).toBe(
      0.92,
    );
    expect(resolveExternalCueLayerVolume({ preferGuideTrackMutation: true, masterVolume: 0.9 })).toBe(
      0.14,
    );
  });

  it("chooses sample, track-slice, or oscillator playback engines", () => {
    expect(
      resolveCuePlaybackEngine({
        sampleBufferReady: true,
        preferGuideTrackMutation: true,
        currentDeckAvailable: true,
        effectiveLiveMutationState: "warning",
        voiceTrack: "foundation",
        voicedCue: cue(),
      }),
    ).toBe("sample");

    expect(
      resolveCuePlaybackEngine({
        sampleBufferReady: false,
        preferGuideTrackMutation: true,
        currentDeckAvailable: true,
        effectiveLiveMutationState: "critical",
        voiceTrack: "motion",
        voicedCue: cue({ routeKey: "error", level: "ERROR" }),
      }),
    ).toBe("track-slice");

    expect(
      resolveCuePlaybackEngine({
        sampleBufferReady: false,
        preferGuideTrackMutation: false,
        currentDeckAvailable: false,
        effectiveLiveMutationState: "normal",
        voiceTrack: "accent",
        voicedCue: cue({ routeKey: "warn", level: "WARN" }),
      }),
    ).toBe("oscillator");

    expect(
      resolveCuePlaybackEngine({
        sampleBufferReady: false,
        preferGuideTrackMutation: true,
        currentDeckAvailable: true,
        effectiveLiveMutationState: "warning",
        voiceTrack: "foundation",
        voicedCue: cue({ routeKey: "warn", level: "WARN" }),
      }),
    ).toBe("track-slice");
  });

  it("caps cues, drops non-anomalous info voices in guide mode and preserves anomaly playback", () => {
    const plan = buildCuePlaybackPlan({
      cues: [
        cue({ id: "cue-1", eventIndex: 0, routeKey: "info", level: "INFO", accent: "none" }),
        cue({
          id: "cue-2",
          eventIndex: 1,
          routeKey: "anomaly",
          level: "ERROR",
          accent: "anomaly",
          gain: 0.3,
        }),
        cue({ id: "cue-3", eventIndex: 2, routeKey: "error", level: "ERROR", gain: 0.24 }),
      ],
      arrangementDepth: "full",
      maxCuesPerWindow: 2,
      hasGuideTrackMutation: true,
      effectiveLiveMutationState: "normal",
    });

    expect(plan.cappedCues).toHaveLength(2);
    expect(plan.cueIntensityMultiplier).toBe(0.08);
    expect(plan.audibleVoiceEntries.every((entry) => entry.voicedCue.routeKey !== "info")).toBe(true);
    expect(plan.audibleVoiceEntriesForPlayback.some((entry) => entry.voicedCue.accent === "anomaly")).toBe(
      true,
    );
    expect(plan.audibleVoicedCues.every((entry) => entry.gain >= 0.002)).toBe(true);
  });

  it("keeps external cues open during critical guide-track mutation", () => {
    const plan = buildCuePlaybackPlan({
      cues: [cue({ routeKey: "error", level: "ERROR", accent: "anomaly", gain: 0.26 })],
      arrangementDepth: "minimal",
      maxCuesPerWindow: 4,
      hasGuideTrackMutation: true,
      effectiveLiveMutationState: "critical",
    });

    expect(plan.allowExternalCueLayer).toBe(true);
    expect(plan.cueIntensityMultiplier).toBe(0.34);
    expect(plan.audibleVoiceEntriesForPlayback.length).toBeGreaterThan(0);
  });
});
