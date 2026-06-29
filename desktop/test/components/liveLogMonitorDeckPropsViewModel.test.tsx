import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { en } from "../../src/i18n/en";
import {
  buildLiveLogMonitorDeckSectionContent,
  buildLiveLogMonitorLiveDeckProps,
  buildLiveLogMonitorRoutingPanel,
  buildLiveLogMonitorScenePanel,
} from "../../src/features/analyzer/components/liveLogMonitorDeckPropsViewModel";
import { ComponentRoutingPanel } from "../../src/features/analyzer/components/ComponentRoutingPanel";
import { LiveLogMonitorDeckSection } from "../../src/features/analyzer/components/LiveLogMonitorDeckSection";
import { LiveSonificationScenePanel } from "../../src/features/analyzer/components/LiveSonificationScenePanel";
import { LiveWaveformCanvas } from "../../src/features/analyzer/components/LiveWaveformCanvas";

describe("liveLogMonitorDeckPropsViewModel", () => {
  it("builds the deck section node with waveform accent and translated labels", () => {
    const node = buildLiveLogMonitorDeckSectionContent({
      t: en,
      liveEnabled: true,
      replayActive: false,
      playbackEventIndex: null,
      beatClockBpm: 126,
      repositorySuggestedBpm: 122,
      sceneGenreId: "tropical-house",
      isAnomalyFlash: true,
      traceWaveformTrack: null,
      traceWaveformExplanations: [],
      traceWaveformCues: [],
      traceWaveformCurrentTime: 18,
      recentExplanations: [],
      selectedExplanationId: null,
      recentCues: [],
      recentVoices: [],
      recentMarkers: [],
      recentWarnings: [],
      error: null,
      lastUpdateSummary: "Window stable",
      lastUpdateTopComponents: [{ component: "api", count: 3 }],
      windowMetricGridItems: [{ label: "Lines", value: 12 }],
      waveAnomalyMarkers: [],
      liveSourceLabel: "/logs/service.log",
      recentSyncTailRows: [],
      anomalySourceRows: [],
      activeTailWindowId: null,
      syncTailListRef: { current: null },
      analyserRef: { current: null },
      onSelectExplanation: vi.fn(),
      onSequencerStepFire: vi.fn(),
    });

    expect(isValidElement(node)).toBe(true);
    expect(node.type).toBe(LiveLogMonitorDeckSection);
    expect(node.props.windowSummary).toBe("Window stable");
    expect(node.props.activityPanelProps.labels.liveSystemRhythm).toBe(en.inspect.liveSystemRhythm);

    const waveform = node.props.activityPanelProps.waveform;
    expect(isValidElement(waveform)).toBe(true);
    expect(waveform.type).toBe(LiveWaveformCanvas);
    expect(waveform.props.accentColor).toBe("#ef7f45");
    expect(waveform.props.isAnomaly).toBe(true);
  });

  it("builds live deck props with playlist/session wiring and uppercase lost label", () => {
    const props = buildLiveLogMonitorLiveDeckProps({
      t: en,
      liveEnabled: true,
      basePlaylistName: "Night set",
      hasBasePlaylist: true,
      replayActive: true,
      playbackProgress: 0.35,
      playbackPercent: 35,
      playbackWindowLabel: "00:35",
      isPlaybackPaused: false,
      playbackEventCount: 12,
      playbackEventIndex: 4,
      replaySessionId: "session-1",
      sessionRepoTitle: "visits-service",
      sessionCardDisplay: {
        title: "Replay session",
        sourceSummary: "Stored source",
        replayProgressSummary: "35% complete",
      },
      metricGridItems: [{ label: "Lines", value: 12 }],
      masterVolume: 0.7,
      repositorySourcePath: "/logs/service.log",
      playlistSummaryItems: [],
      nowPlayingSummary: "Now playing",
      upNextSummary: "Up next",
      selectedStyleProfileDescription: "Warm",
      selectedMutationProfileDescription: "Reactive",
      activeReplayBookmark: null,
      sortedSessionBookmarks: [],
      bookmarkLabelDraft: "",
      bookmarkNoteDraft: "",
      bookmarkTagDraft: null,
      bookmarkStyleProfileIdDraft: null,
      bookmarkMutationProfileIdDraft: null,
      bookmarkBusy: false,
      bookmarkError: null,
      replayFeedbackRecommendation: null,
      activeDeckContent: "deck",
      scenePanel: "scene",
      routingPanel: "routing",
      onSetMasterVolume: vi.fn(),
      onToggleMute: vi.fn(),
      onStepWindow: vi.fn(),
      onTogglePause: vi.fn(),
      onSeekProgress: vi.fn(),
      onBookmarkLabelChange: vi.fn(),
      onBookmarkNoteChange: vi.fn(),
      onBookmarkTagToggle: vi.fn(),
      onBookmarkStyleProfileChange: vi.fn(),
      onBookmarkMutationProfileChange: vi.fn(),
      onCaptureCurrentScene: vi.fn(),
      onSaveBookmark: vi.fn(),
      onDeleteCurrentBookmark: vi.fn(),
      onJumpToBookmark: vi.fn(),
      onApplyBookmarkSuggestion: vi.fn(),
      onDeleteBookmark: vi.fn(),
      onApplyReplayFeedbackRecommendation: vi.fn(),
    });

    expect(props.playlistSummaryProps.title).toBe("Night set");
    expect(props.playlistSummaryProps.profileDescription).toBe("Warm Reactive");
    expect(props.playlistSummaryProps.lostLabel).toBe(en.library.lost.toUpperCase());
    expect(props.sessionCardProps).toMatchObject({
      replayActive: true,
      repoTitle: "visits-service",
    });
    expect(props.operationsPanelProps.labels.liveSourcePath).toBe(en.inspect.liveSourcePath);
    expect(props.replaySectionProps.replaySessionId).toBe("session-1");
  });

  it("builds scene and routing panels as focused component nodes", () => {
    const scenePanel = buildLiveLogMonitorScenePanel({
      availableBaseAssets: [{ id: "asset-1", name: "Pulse", storagePath: "/asset.wav", sourcePath: "/asset.wav", kind: "sample-pack", importedAt: "2026-06-28T00:00:00.000Z" }] as never,
      availableCompositions: [{ id: "comp-1", name: "Hybrid", storagePath: "/comp", exportedAt: "2026-06-28T00:00:00.000Z", stemPaths: [] }] as never,
      sceneBaseAssetId: "asset-1",
      sceneCompositionId: "comp-1",
      scene: { genreId: "house" } as never,
      onSceneBaseAssetIdChange: vi.fn(),
      onSceneCompositionIdChange: vi.fn(),
    });
    const routingPanel = buildLiveLogMonitorRoutingPanel({
      knownComponents: ["api", "db"],
      overrides: new Map([["api", "accent"]]) as never,
      liveActive: true,
      onOverrideChange: vi.fn(),
    });

    expect(isValidElement(scenePanel)).toBe(true);
    expect(scenePanel.type).toBe(LiveSonificationScenePanel);
    expect(scenePanel.props.sceneBaseAssetId).toBe("asset-1");

    expect(isValidElement(routingPanel)).toBe(true);
    expect(routingPanel.type).toBe(ComponentRoutingPanel);
    expect(routingPanel.props.knownComponents).toEqual(["api", "db"]);
    expect(routingPanel.props.liveActive).toBe(true);
  });
});
