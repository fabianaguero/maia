import { describe, expect, it, vi } from "vitest";

import {
  buildLiveLogMonitorDeckBookmarkCallbacks,
  buildLiveLogMonitorDeckPlaybackCallbacks,
} from "../../../../src/features/analyzer/components/liveLogMonitorPanelDeckCallbacksRuntime";

function createInput() {
  return {
    monitor: {
      isPlaybackPaused: false,
      pausePlayback: vi.fn(),
      resumePlayback: vi.fn(),
      seekPlaybackProgress: vi.fn(),
      stepPlaybackWindow: vi.fn(),
    },
    setBookmarkLabelDraft: vi.fn(),
    setBookmarkNoteDraft: vi.fn(),
    setBookmarkTagDraft: vi.fn(),
    setBookmarkStyleProfileIdDraft: vi.fn(),
    setBookmarkMutationProfileIdDraft: vi.fn(),
    captureCurrentScene: vi.fn(),
    saveReplayBookmark: vi.fn(),
    deleteReplayBookmark: vi.fn(),
    activeReplayBookmark: { id: "bookmark-1" },
  } as never;
}

function createOperatorActions() {
  return {
    handleApplyBookmarkSuggestion: vi.fn(),
    handleApplyReplayFeedbackRecommendation: vi.fn(),
    handleJumpToBookmark: vi.fn(),
    handleSelectTraceExplanation: vi.fn(),
    handleSetMasterVolume: vi.fn(),
    handleToggleMute: vi.fn(),
  };
}

describe("liveLogMonitorPanelDeckCallbacksRuntime", () => {
  it("builds playback callbacks against the monitor transport", () => {
    const input = createInput();
    const callbacks = buildLiveLogMonitorDeckPlaybackCallbacks(input);

    callbacks.onStepWindow(1);
    callbacks.onSeekProgress(0.42);
    callbacks.onTogglePause();

    expect(input.monitor.stepPlaybackWindow).toHaveBeenCalledWith(1);
    expect(input.monitor.seekPlaybackProgress).toHaveBeenCalledWith(0.42);
    expect(input.monitor.pausePlayback).toHaveBeenCalled();
  });

  it("builds bookmark callbacks and routes draft changes and deletes", () => {
    const input = createInput();
    const operatorActions = createOperatorActions();
    const callbacks = buildLiveLogMonitorDeckBookmarkCallbacks(input, operatorActions);

    callbacks.onBookmarkLabelChange("Alert");
    callbacks.onBookmarkNoteChange("note");
    callbacks.onBookmarkStyleProfileChange("style-1");
    callbacks.onBookmarkMutationProfileChange("mutation-1");
    callbacks.onCaptureCurrentScene();
    callbacks.onSaveBookmark();
    callbacks.onDeleteCurrentBookmark();
    callbacks.onDeleteBookmark({ id: "bookmark-2" } as never);
    callbacks.onJumpToBookmark({ id: "bookmark-3" } as never);
    callbacks.onApplyBookmarkSuggestion({ id: "bookmark-4" } as never);
    callbacks.onApplyReplayFeedbackRecommendation();
    callbacks.onSelectExplanation({ id: "explanation-1" } as never);
    callbacks.onSetMasterVolume(0.9);
    callbacks.onToggleMute();

    expect(input.setBookmarkLabelDraft).toHaveBeenCalledWith("Alert");
    expect(input.setBookmarkNoteDraft).toHaveBeenCalledWith("note");
    expect(input.setBookmarkStyleProfileIdDraft).toHaveBeenCalledWith("style-1");
    expect(input.setBookmarkMutationProfileIdDraft).toHaveBeenCalledWith("mutation-1");
    expect(input.captureCurrentScene).toHaveBeenCalled();
    expect(input.saveReplayBookmark).toHaveBeenCalled();
    expect(input.deleteReplayBookmark).toHaveBeenCalledWith({ id: "bookmark-1" });
    expect(input.deleteReplayBookmark).toHaveBeenCalledWith({ id: "bookmark-2" });
    expect(operatorActions.handleJumpToBookmark).toHaveBeenCalledWith({ id: "bookmark-3" });
    expect(operatorActions.handleApplyBookmarkSuggestion).toHaveBeenCalledWith({
      id: "bookmark-4",
    });
    expect(operatorActions.handleApplyReplayFeedbackRecommendation).toHaveBeenCalled();
    expect(operatorActions.handleSelectTraceExplanation).toHaveBeenCalledWith({
      id: "explanation-1",
    });
    expect(operatorActions.handleSetMasterVolume).toHaveBeenCalledWith(0.9);
    expect(operatorActions.handleToggleMute).toHaveBeenCalled();
  });
});
