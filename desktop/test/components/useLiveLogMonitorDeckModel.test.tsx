import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLiveLogMonitorDeckModel } from "../../src/features/analyzer/components/useLiveLogMonitorDeckModel";

const buildLiveLogMonitorDeckModelState = vi.fn(() => ({
  deckStatusLabel: "status",
  ctaMetaLabel: "cta-meta",
  basePlaylistEditorItems: ["editor"],
  liveDeckProps: { panel: "deck-props" },
}));
const applyLiveLogMonitorComponentOverride = vi.fn();

vi.mock("../../src/features/analyzer/components/liveLogMonitorDeckModelRuntime", () => ({
  buildLiveLogMonitorDeckModelState: (...args: unknown[]) =>
    buildLiveLogMonitorDeckModelState(...args),
  applyLiveLogMonitorComponentOverride: (...args: unknown[]) =>
    applyLiveLogMonitorComponentOverride(...args),
}));

describe("useLiveLogMonitorDeckModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assembles deck view state and forwards derived content into live deck props", () => {
    const { result } = renderHook(() =>
      useLiveLogMonitorDeckModel({
        t: { inspect: {}, session: {}, library: {} } as never,
        repository: {
          id: "repo-1",
          title: "repo",
          sourcePath: "/logs/app.log",
          suggestedBpm: 126,
        } as never,
        liveEnabled: true,
        replayActive: false,
        playbackPercent: 35,
        playbackWindowLabel: "3/10",
        playbackProgress: 0.35,
        playbackEventCount: 10,
        playbackEventIndex: 3,
        isPlaybackPaused: false,
        persistedSessionId: "session-1",
        sessionRepoTitle: "repo",
        sessionRepoId: "repo-1",
        session: { repoId: "repo-1" } as never,
        metrics: { windowCount: 4, processedLines: 120, totalAnomalies: 2 },
        bounceWindowCount: 7,
        beatClockBpm: 126,
        beatLooperActive: true,
        backgroundPlayheadSecond: 42,
        backgroundNowPlayingTrack: null,
        backgroundTransitionNextTrack: null,
        backgroundTransitionPlan: null,
        availableTracks: [],
        availablePlaylists: [],
        availableBaseAssets: [],
        availableCompositions: [],
        availableBaseTrackOptions: [],
        basePlaylist: { name: "bed", trackIds: [] } as never,
        baseTrackCount: 0,
        hasBaseListeningBed: false,
        adapterDescription: "desc",
        adapterTarget: "target",
        activeAdapterLabel: "FILE",
        cueEnginePreviewLabel: "cue-engine",
        liveMutationStateLabel: "mutation",
        lastUpdate: { summary: "summary", topComponents: [] } as never,
        recentMarkers: [],
        recentWarnings: [],
        recentCues: [],
        recentVoices: [],
        recentExplanations: [],
        selectedExplanationId: null,
        selectedTraceExplanation: null,
        traceWaveformTrack: null,
        traceWaveformExplanations: [],
        traceWaveformCues: [],
        activeTailWindowId: null,
        syncTailRows: [],
        analyserRef: { current: null },
        syncTailListRef: { current: null },
        error: null,
        isAnomalyFlash: false,
        audioStatus: "ready",
        sampleStatus: "ready",
        sampleSourceCount: 2,
        emittedCueCount: 8,
        emittedVoiceCount: 4,
        selectedStyleProfile: { label: "style", description: "style-desc" },
        selectedMutationProfile: { label: "mutation", description: "mutation-desc" },
        scene: { genreId: "house" } as never,
        sceneBaseAssetId: "asset-1",
        sceneCompositionId: "comp-1",
        knownComponents: ["api"],
        componentOverrides: new Map(),
        masterVolume: 0.5,
        replayFeedbackRecommendation: null,
        activeReplayBookmark: null,
        sortedSessionBookmarks: [],
        bookmarkLabelDraft: "",
        bookmarkNoteDraft: "",
        bookmarkTagDraft: null,
        bookmarkStyleProfileIdDraft: null,
        bookmarkMutationProfileIdDraft: null,
        bookmarkBusy: false,
        bookmarkError: null,
        setComponentOverrides: vi.fn(),
        setSceneBaseAssetId: vi.fn(),
        setSceneCompositionId: vi.fn(),
        onSelectExplanation: vi.fn(),
        onSequencerStepFire: vi.fn(),
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
      }),
    );

    expect(buildLiveLogMonitorDeckModelState).toHaveBeenCalledWith(
      expect.objectContaining({
        deckInput: expect.objectContaining({
          bounceWindowCount: 7,
          repository: expect.objectContaining({
            sourcePath: "/logs/app.log",
          }),
        }),
        onOverrideChange: expect.any(Function),
      }),
    );
    expect(result.current.deckStatusLabel).toBe("status");
    expect(result.current.ctaMetaLabel).toBe("cta-meta");
    expect(result.current.basePlaylistEditorItems).toEqual(["editor"]);
    expect(result.current.liveDeckProps).toEqual({ panel: "deck-props" });
  });
});
