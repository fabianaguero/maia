import { describe, expect, it } from "vitest";

import type { SessionBookmark } from "../../../../src/api/sessions";
import type { LiveMutationExplanation } from "../../../../src/utils/liveMutationExplainability";
import {
  resolveBookmarkJumpState,
  resolveTraceExplanationSelection,
} from "../../../../src/features/analyzer/components/liveLogMonitorInteractionRuntime";

function createExplanation(
  overrides: Partial<LiveMutationExplanation> = {},
): LiveMutationExplanation {
  return {
    id: "exp-1",
    eventIndex: 4,
    level: "warn",
    component: "payments",
    triggerLabel: "burst",
    triggerDetail: "warning burst",
    resultLabel: "filter opens",
    resultDetail: "more harmonic edge",
    routeKey: "warn",
    routeLabel: "warn",
    noteHz: 440,
    durationMs: 180,
    gain: 0.7,
    waveform: "sawtooth",
    isAnomalyDriven: true,
    replayWindowIndex: 3,
    trackSecond: 18.5,
    trackTitle: "Alpha",
    ...overrides,
  };
}

function createBookmark(overrides: Partial<SessionBookmark> = {}): SessionBookmark {
  return {
    id: 1,
    sessionId: "session-1",
    replayWindowIndex: 5,
    eventIndex: 5,
    label: "Burst",
    note: null,
    bookmarkTag: null,
    suggestedStyleProfileId: null,
    suggestedMutationProfileId: null,
    trackId: null,
    trackTitle: null,
    trackSecond: 42,
    createdAt: "2026-06-26T00:00:00.000Z",
    updatedAt: "2026-06-26T00:00:00.000Z",
    ...overrides,
  };
}

describe("liveLogMonitorInteractionRuntime", () => {
  it("resolves trace selection state for replay scrubbing", () => {
    const state = resolveTraceExplanationSelection({
      replayActive: true,
      playbackEventCount: 20,
      explanation: createExplanation(),
    });

    expect(state.shouldPausePlayback).toBe(true);
    expect(state.nextPlaybackProgress).toBeCloseTo(0.10526315789473684);
    expect(state.nextSelectedExplanationId).toBe("exp-1");
    expect(state.nextBackgroundPlayheadSecond).toBe(18.5);
  });

  it("keeps live selection local when replay seek is unavailable", () => {
    const state = resolveTraceExplanationSelection({
      replayActive: false,
      playbackEventCount: null,
      explanation: createExplanation({ replayWindowIndex: null, trackSecond: null }),
    });

    expect(state.shouldPausePlayback).toBe(false);
    expect(state.nextPlaybackProgress).toBeNull();
    expect(state.nextBackgroundPlayheadSecond).toBeNull();
  });

  it("resolves bookmark jump state and preserves linked explanation id", () => {
    const state = resolveBookmarkJumpState({
      playbackEventCount: 10,
      bookmark: createBookmark(),
      bookmarkExplanation: createExplanation({ id: "exp-linked" }),
    });

    expect(state).toMatchObject({
      shouldPausePlayback: true,
      nextPlaybackProgress: 0.4444444444444444,
      nextSelectedExplanationId: "exp-linked",
      nextBackgroundPlayheadSecond: 42,
    });
  });

  it("returns null when bookmark playback cannot seek", () => {
    expect(
      resolveBookmarkJumpState({
        playbackEventCount: null,
        bookmark: createBookmark(),
        bookmarkExplanation: null,
      }),
    ).toBeNull();
  });
});
