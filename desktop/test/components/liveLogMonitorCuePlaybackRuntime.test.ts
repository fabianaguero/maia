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
  });
});
