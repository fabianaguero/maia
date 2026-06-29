import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SessionBookmark } from "../../src/api/sessions";
import { useLiveLogMonitorOperatorActions } from "../../src/features/analyzer/components/useLiveLogMonitorOperatorActions";

function createBookmark(overrides: Partial<SessionBookmark> = {}): SessionBookmark {
  return {
    id: 1,
    sessionId: "session-1",
    replayWindowIndex: 3,
    label: "Spike",
    note: null,
    bookmarkTag: null,
    styleProfileId: "style-2",
    mutationProfileId: "mutation-2",
    trackId: "track-1",
    trackTitle: "Track 1",
    trackSecond: 92,
    createdAt: "2026-06-27T12:00:00.000Z",
    updatedAt: "2026-06-27T12:00:00.000Z",
    ...overrides,
  };
}

describe("useLiveLogMonitorOperatorActions", () => {
  it("toggles mute while preserving the previous audible volume", () => {
    let masterVolume = 0.42;
    const setMasterVolume = vi.fn((updater) => {
      masterVolume =
        typeof updater === "function"
          ? updater(masterVolume)
          : updater;
    });

    const { result } = renderHook(() =>
      useLiveLogMonitorOperatorActions({
        repositoryId: "repo-1",
        basePlaylist: { trackIds: ["track-1"] },
        selectedStyleProfileId: "style-1",
        selectedMutationProfileId: "mutation-1",
        replayFeedbackRecommendation: null,
        recentExplanations: [],
        replayActive: false,
        playbackEventCount: null,
        previousAudibleVolumeRef: { current: 0.42 },
        setSelectedStyleProfileId: vi.fn(),
        setSelectedMutationProfileId: vi.fn(),
        setSelectedExplanationId: vi.fn(),
        setBackgroundPlayheadSecond: vi.fn(),
        setMasterVolume,
        monitor: {
          pausePlayback: vi.fn(),
          seekPlaybackProgress: vi.fn(),
        },
      }),
    );

    act(() => {
      result.current.handleToggleMute();
    });
    expect(masterVolume).toBe(0);

    act(() => {
      result.current.handleToggleMute();
    });
    expect(masterVolume).toBe(0.42);
  });

  it("applies bookmark suggestions and replay feedback to operator selections", () => {
    const setSelectedStyleProfileId = vi.fn();
    const setSelectedMutationProfileId = vi.fn();

    const { result } = renderHook(() =>
      useLiveLogMonitorOperatorActions({
        repositoryId: "repo-1",
        basePlaylist: { trackIds: ["track-1"] },
        selectedStyleProfileId: "style-1",
        selectedMutationProfileId: "mutation-1",
        replayFeedbackRecommendation: {
          styleProfileId: "style-3",
          mutationProfileId: "mutation-4",
        },
        recentExplanations: [],
        replayActive: false,
        playbackEventCount: null,
        previousAudibleVolumeRef: { current: 0.42 },
        setSelectedStyleProfileId,
        setSelectedMutationProfileId,
        setSelectedExplanationId: vi.fn(),
        setBackgroundPlayheadSecond: vi.fn(),
        setMasterVolume: vi.fn(),
        monitor: {
          pausePlayback: vi.fn(),
          seekPlaybackProgress: vi.fn(),
        },
      }),
    );

    act(() => {
      result.current.handleApplyBookmarkSuggestion(createBookmark());
      result.current.handleApplyReplayFeedbackRecommendation();
    });

    expect(setSelectedStyleProfileId).toHaveBeenCalled();
    expect(setSelectedMutationProfileId).toHaveBeenCalled();
  });

  it("jumps to bookmark and trace explanations through playback controls", () => {
    const pausePlayback = vi.fn();
    const seekPlaybackProgress = vi.fn();
    const setSelectedExplanationId = vi.fn();
    const setBackgroundPlayheadSecond = vi.fn();

    const explanation = {
      id: "exp-1",
      replayWindowIndex: 3,
      trackSecond: 92,
      trackId: "track-1",
      trackTitle: "Track 1",
      eventIndex: 3,
    };

    const { result } = renderHook(() =>
      useLiveLogMonitorOperatorActions({
        repositoryId: "repo-1",
        basePlaylist: { trackIds: ["track-1"] },
        selectedStyleProfileId: "style-1",
        selectedMutationProfileId: "mutation-1",
        replayFeedbackRecommendation: null,
        recentExplanations: [explanation as never],
        replayActive: true,
        playbackEventCount: 6,
        previousAudibleVolumeRef: { current: 0.42 },
        setSelectedStyleProfileId: vi.fn(),
        setSelectedMutationProfileId: vi.fn(),
        setSelectedExplanationId,
        setBackgroundPlayheadSecond,
        setMasterVolume: vi.fn(),
        monitor: {
          pausePlayback,
          seekPlaybackProgress,
        },
      }),
    );

    act(() => {
      result.current.handleJumpToBookmark(createBookmark());
      result.current.handleSelectTraceExplanation(explanation as never);
    });

    expect(pausePlayback).toHaveBeenCalled();
    expect(seekPlaybackProgress).toHaveBeenCalled();
    expect(setSelectedExplanationId).toHaveBeenCalled();
    expect(setBackgroundPlayheadSecond).toHaveBeenCalled();
  });
});
