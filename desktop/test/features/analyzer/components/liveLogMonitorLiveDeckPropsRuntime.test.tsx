import { describe, expect, it, vi } from "vitest";

import type { AppTranslations } from "../../../../src/i18n/en";
import type {
  MetricGridItem,
  SessionCardDisplay,
} from "../../../../src/features/analyzer/components/liveLogMonitorDisplayRuntime";
import {
  buildLiveLogMonitorOperationsPanelProps,
  buildLiveLogMonitorPlaylistSummaryProps,
  buildLiveLogMonitorReplaySectionProps,
  buildLiveLogMonitorSessionCardProps,
} from "../../../../src/features/analyzer/components/liveLogMonitorLiveDeckPropsRuntime";

function createTranslations(): AppTranslations {
  return {
    inspect: {
      basePlaylist: "Base playlist",
      replayProgressAria: "Replay progress",
      sceneAlreadyAligned: "Scene already aligned",
      applyFeedbackMix: "Apply feedback mix",
      masterVolume: "Master volume",
      masterVolumeAria: "Master volume aria",
      muteAction: "Mute",
      unmuteAction: "Unmute",
      replaySourcePath: "Replay source path",
      liveSourcePath: "Live source path",
    },
    library: {
      lost: "lost",
    },
  } as unknown as AppTranslations;
}

function createMetricGridItems(): MetricGridItem[] {
  return [
    {
      id: "lines",
      label: "Lines",
      value: "128",
      tone: "default",
    },
  ];
}

function createSessionCardDisplay(): SessionCardDisplay {
  return {
    modeLabel: "Live",
    transportLabel: "Attached",
    statusLabel: "Running",
    pathLabel: "/logs/service.log",
    detailRows: [],
  };
}

describe("liveLogMonitorLiveDeckPropsRuntime", () => {
  it("builds playlist summary props with uppercase lost label", () => {
    const props = buildLiveLogMonitorPlaylistSummaryProps({
      t: createTranslations(),
      basePlaylistName: "Night shift",
      nowPlayingSummary: "Now playing",
      upNextSummary: "Up next",
      selectedStyleProfileDescription: "Deep",
      selectedMutationProfileDescription: "Reactive",
      playlistSummaryItems: [],
    });

    expect(props).toMatchObject({
      label: "Base playlist",
      title: "Night shift",
      nowPlayingLine: "Now playing",
      upNextLine: "Up next",
      profileDescription: "Deep Reactive",
      lostLabel: "LOST",
    });
  });

  it("returns a session card only when live mode has a title and display", () => {
    expect(
      buildLiveLogMonitorSessionCardProps({
        t: createTranslations(),
        liveEnabled: false,
        replayActive: false,
        playbackPercent: 50,
        sessionRepoTitle: "repo",
        sessionCardDisplay: createSessionCardDisplay(),
      }),
    ).toBeNull();

    const props = buildLiveLogMonitorSessionCardProps({
      t: createTranslations(),
      liveEnabled: true,
      replayActive: true,
      playbackPercent: 64,
      sessionRepoTitle: "repo",
      sessionCardDisplay: createSessionCardDisplay(),
    });

    expect(props).toMatchObject({
      replayActive: true,
      replayProgressAria: "Replay progress",
      playbackPercent: 64,
      repoTitle: "repo",
    });
  });

  it("builds replay section props with labels and callbacks", () => {
    const onStepWindow = vi.fn();
    const onTogglePause = vi.fn();
    const onSeekProgress = vi.fn();
    const onBookmarkLabelChange = vi.fn();
    const onBookmarkNoteChange = vi.fn();
    const onBookmarkTagToggle = vi.fn();
    const onBookmarkStyleProfileChange = vi.fn();
    const onBookmarkMutationProfileChange = vi.fn();
    const onCaptureCurrentScene = vi.fn();
    const onSaveBookmark = vi.fn();
    const onDeleteCurrentBookmark = vi.fn();
    const onJumpToBookmark = vi.fn();
    const onApplyBookmarkSuggestion = vi.fn();
    const onDeleteBookmark = vi.fn();
    const onApplyReplayFeedbackRecommendation = vi.fn();

    const props = buildLiveLogMonitorReplaySectionProps({
      t: createTranslations(),
      replayActive: true,
      playbackProgress: 0.4,
      playbackPercent: 40,
      playbackWindowLabel: "00:12",
      isPlaybackPaused: false,
      playbackEventCount: 12,
      playbackEventIndex: 5,
      replaySessionId: "session-1",
      activeReplayBookmark: null,
      sortedSessionBookmarks: [],
      bookmarkLabelDraft: "burst",
      bookmarkNoteDraft: "note",
      bookmarkTagDraft: "warn",
      bookmarkStyleProfileIdDraft: "deep",
      bookmarkMutationProfileIdDraft: "reactive",
      bookmarkBusy: false,
      bookmarkError: null,
      replayFeedbackRecommendation: null,
      onStepWindow,
      onTogglePause,
      onSeekProgress,
      onBookmarkLabelChange,
      onBookmarkNoteChange,
      onBookmarkTagToggle,
      onBookmarkStyleProfileChange,
      onBookmarkMutationProfileChange,
      onCaptureCurrentScene,
      onSaveBookmark,
      onDeleteCurrentBookmark,
      onJumpToBookmark,
      onApplyBookmarkSuggestion,
      onDeleteBookmark,
      onApplyReplayFeedbackRecommendation,
    });

    expect(props.labels).toEqual({
      sceneAlreadyAligned: "Scene already aligned",
      applyFeedbackMix: "Apply feedback mix",
    });
    expect(props.onBookmarkLabelChange).toBe(onBookmarkLabelChange);
    expect(props.onApplyReplayFeedbackRecommendation).toBe(onApplyReplayFeedbackRecommendation);
  });

  it("builds operations panel props with source labels and embedded panels", () => {
    const onSetMasterVolume = vi.fn();
    const onToggleMute = vi.fn();

    const props = buildLiveLogMonitorOperationsPanelProps({
      t: createTranslations(),
      metricGridItems: createMetricGridItems(),
      masterVolume: 0.72,
      replayActive: true,
      repositorySourcePath: "/logs/service.log",
      scenePanel: "scene-panel",
      routingPanel: "routing-panel",
      onSetMasterVolume,
      onToggleMute,
    });

    expect(props.metricGridItems).toHaveLength(1);
    expect(props.labels.masterVolume).toBe("Master volume");
    expect(props.scenePanel).toBe("scene-panel");
    expect(props.routingPanel).toBe("routing-panel");
    expect(props.onSetMasterVolume).toBe(onSetMasterVolume);
    expect(props.onToggleMute).toBe(onToggleMute);
  });
});
