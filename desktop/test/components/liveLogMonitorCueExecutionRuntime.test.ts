import { describe, expect, it } from "vitest";

import type {
  CuePlaybackPlan,
  AudibleVoiceEntry,
} from "../../src/features/analyzer/components/liveLogMonitorCuePlaybackRuntime";
import type {
  ArrangementVoice,
  RoutedLiveCue,
  SequencerPreset,
} from "../../src/features/analyzer/components/liveSonificationScene";
import {
  appendBounceCueWindows,
  buildCueGraphSchedulePlan,
  buildExternalCueLayerPlan,
} from "../../src/features/analyzer/components/liveLogMonitorCueExecutionRuntime";

function createCue(id: string, overrides: Partial<RoutedLiveCue> = {}): RoutedLiveCue {
  return {
    id,
    timestamp: Date.now(),
    noteHz: 330,
    durationMs: 180,
    gain: 0.22,
    pan: 0,
    waveform: "triangle",
    accent: "normal",
    routeKey: "warn",
    traceId: null,
    sourceLabel: "services",
    eventIndex: 0,
    voiceName: "warn",
    trackId: "track-1",
    componentName: null,
    sourceLine: "warn line",
    markerId: null,
    ...overrides,
  };
}

function createEntry(
  cue: RoutedLiveCue,
  overrides: Partial<ArrangementVoice> = {},
): AudibleVoiceEntry {
  return {
    voice: {
      cue,
      track: "foundation",
      panOffset: 0,
      noteMultiplier: 1,
      gainMultiplier: 1,
      timeOffsetMs: 0,
      ...overrides,
    },
    voicedCue: cue,
  };
}

function createPlaybackPlan(overrides: Partial<CuePlaybackPlan> = {}): CuePlaybackPlan {
  const cueA = createCue("a");
  const cueB = createCue("b", { eventIndex: 1 });
  const entries = [createEntry(cueA), createEntry(cueB, { timeOffsetMs: 14 })];
  return {
    preferGuideTrackMutation: false,
    cueIntensityMultiplier: 1,
    allowExternalCueLayer: true,
    cappedCues: [cueA, cueB],
    voices: entries.map((entry) => entry.voice),
    voicedCues: entries.map((entry) => entry.voicedCue),
    audibleVoiceEntries: entries,
    audibleVoiceEntriesForPlayback: entries,
    audibleVoicedCues: entries.map((entry) => entry.voicedCue),
    ...overrides,
  };
}

const preset: Pick<SequencerPreset, "useBeatGrid" | "rhythmDivision" | "scheduleGapMs"> = {
  useBeatGrid: true,
  rhythmDivision: 4,
  scheduleGapMs: 180,
};

describe("liveLogMonitorCueExecutionRuntime", () => {
  it("enables external layer only when there are audible cues", () => {
    expect(buildExternalCueLayerPlan(createPlaybackPlan())).toEqual({
      shouldRender: true,
      cueCount: 2,
    });

    expect(
      buildExternalCueLayerPlan(createPlaybackPlan({ audibleVoicedCues: [], allowExternalCueLayer: true })),
    ).toEqual({
      shouldRender: false,
      cueCount: 0,
    });
  });

  it("caps bounce windows while preserving latest voiced window", () => {
    const windows = appendBounceCueWindows([[createCue("old")]], [createCue("new")], 1);
    expect(windows).toHaveLength(1);
    expect(windows[0]?.[0]?.id).toBe("new");
  });

  it("builds beat-locked cue scheduling from the active clock", () => {
    const plan = buildCueGraphSchedulePlan({
      playbackPlan: createPlaybackPlan(),
      contextState: "running",
      currentTime: 12.12,
      beatClock: { originTime: 12, bpm: 120 },
      liveBpm: 120,
      preset,
    });

    expect(plan.shouldSchedule).toBe(true);
    expect(plan.useBeatGrid).toBe(true);
    expect(plan.firstCueAt).toBeCloseTo(12.5, 4);
    expect(plan.events[0]?.cueStartAt).toBeCloseTo(12.5, 4);
    expect(plan.events[1]?.cueStartAt).toBeCloseTo(13.014, 4);
  });

  it("falls back to gap-based scheduling without beat grid", () => {
    const plan = buildCueGraphSchedulePlan({
      playbackPlan: createPlaybackPlan(),
      contextState: "running",
      currentTime: 4,
      beatClock: null,
      liveBpm: null,
      preset: { ...preset, useBeatGrid: false, scheduleGapMs: 200 },
    });

    expect(plan.useBeatGrid).toBe(false);
    expect(plan.firstCueAt).toBeCloseTo(4.04, 4);
    expect(plan.events[1]?.cueStartAt).toBeCloseTo(4.254, 4);
  });

  it("returns a resume hint when the context is suspended", () => {
    const plan = buildCueGraphSchedulePlan({
      playbackPlan: createPlaybackPlan(),
      contextState: "suspended",
      currentTime: 4,
      beatClock: null,
      liveBpm: null,
      preset,
    });

    expect(plan.shouldSchedule).toBe(false);
    expect(plan.shouldResumeSuspendedContext).toBe(true);
    expect(plan.events).toHaveLength(0);
  });
});
