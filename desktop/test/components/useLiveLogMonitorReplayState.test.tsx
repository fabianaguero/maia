import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorReplayState } from "../../src/features/analyzer/components/useLiveLogMonitorReplayState";

const useReplayBookmarks = vi.fn();
const useReplayFeedbackRecommendation = vi.fn();
const getTrackTitle = vi.fn(() => "Track title");

vi.mock("../../src/hooks/useReplayBookmarks", () => ({
  useReplayBookmarks: (...args: unknown[]) => useReplayBookmarks(...args),
}));

vi.mock("../../src/hooks/useReplayFeedbackRecommendation", () => ({
  useReplayFeedbackRecommendation: (...args: unknown[]) =>
    useReplayFeedbackRecommendation(...args),
}));

vi.mock("../../src/utils/track", () => ({
  getTrackTitle: (...args: unknown[]) => getTrackTitle(...args),
}));

describe("useLiveLogMonitorReplayState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useReplayBookmarks.mockReturnValue({
      sortedSessionBookmarks: [{ id: 1 }],
      activeReplayBookmark: null,
      bookmarkLabelDraft: "",
      setBookmarkLabelDraft: vi.fn(),
      bookmarkNoteDraft: "",
      setBookmarkNoteDraft: vi.fn(),
      bookmarkTagDraft: null,
      setBookmarkTagDraft: vi.fn(),
      bookmarkStyleProfileIdDraft: null,
      setBookmarkStyleProfileIdDraft: vi.fn(),
      bookmarkMutationProfileIdDraft: null,
      setBookmarkMutationProfileIdDraft: vi.fn(),
      bookmarkBusy: false,
      bookmarkError: null,
      captureCurrentScene: vi.fn(),
      saveReplayBookmark: vi.fn(),
      deleteReplayBookmark: vi.fn(),
    });
    useReplayFeedbackRecommendation.mockReturnValue({ suggestion: "tighten" });
  });

  it("derives replay bookmarks and feedback only when replay is active", () => {
    const { result } = renderHook(() =>
      useLiveLogMonitorReplayState({
        replayActive: true,
        persistedSessionId: "session-1",
        playbackEventIndex: 12,
        selectedStyleProfileId: "club",
        selectedMutationProfileId: "reactive",
        currentReplayExplanation: {
          explanationId: "exp-1",
          eventIndex: 12,
          trackId: "track-1",
          trackTitle: "Track title",
          trackSecond: 42,
          summary: "summary",
          rationale: [],
        } as never,
        traceWaveformTrack: { id: "track-1" } as never,
        backgroundPlayheadSecond: 18,
      }),
    );

    expect(useReplayBookmarks).toHaveBeenCalledWith(
      expect.objectContaining({
        replaySessionId: "session-1",
        replayWindowIndex: 12,
        fallbackTrackId: "track-1",
        fallbackTrackTitle: "Track title",
        fallbackTrackSecond: 18,
      }),
    );
    expect(useReplayFeedbackRecommendation).toHaveBeenCalledWith(
      [{ id: 1 }],
      {
        currentStyleProfileId: "club",
        currentMutationProfileId: "reactive",
      },
    );
    expect(result.current.replaySessionId).toBe("session-1");
    expect(result.current.replayFeedbackRecommendation).toEqual({ suggestion: "tighten" });
  });

  it("clears the replay session id when replay is inactive", () => {
    renderHook(() =>
      useLiveLogMonitorReplayState({
        replayActive: false,
        persistedSessionId: "session-1",
        playbackEventIndex: null,
        selectedStyleProfileId: "club",
        selectedMutationProfileId: "reactive",
        currentReplayExplanation: null,
        traceWaveformTrack: null,
        backgroundPlayheadSecond: 0,
      }),
    );

    expect(useReplayBookmarks).toHaveBeenCalledWith(
      expect.objectContaining({
        replaySessionId: null,
      }),
    );
  });
});
