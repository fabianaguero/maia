import { describe, expect, it } from "vitest";

import { en } from "../../src/i18n/en";
import {
  buildLiveLogMonitorPanelPlaylistState,
  buildLiveLogMonitorPanelStatusState,
} from "../../src/features/analyzer/components/liveLogMonitorPanelViewModelRuntime";

describe("liveLogMonitorPanelViewModelRuntime", () => {
  it("builds status and metrics slices from monitor state", () => {
    const state = buildLiveLogMonitorPanelStatusState({
      t: en,
      replayActive: false,
      liveEnabled: true,
      audioStatus: "ready",
      bounceWindowCount: 2,
      bounceWindowSeconds: 6,
      sampleStatus: "ready",
      sampleSourceCount: 2,
      activeAdapterLabel: "File tail",
      selectedStyleProfileLabel: "Nightfall",
      selectedMutationProfileLabel: "Balanced",
      playbackWindowLabel: null,
      metrics: {
        windowCount: 4,
        processedLines: 120,
        totalAnomalies: 3,
      },
      emittedCueCount: 18,
      emittedVoiceCount: 11,
      beatClockBpm: 126,
      beatLooperActive: true,
      hasBaseListeningBed: true,
      baseTrackCount: 3,
      repositorySuggestedBpm: 124,
      session: null,
      playbackPercent: null,
      currentLevelCounts: { warn: 3, error: 1, info: 8 },
      audioStateLabel: en.inspect.audioOn,
      lastUpdate: {
        sourcePath: "/logs/live.log",
        fromOffset: 100,
        toOffset: 240,
        hasData: true,
        summary: "window active",
        suggestedBpm: 126,
        confidence: 0.82,
        dominantLevel: "warn",
        lineCount: 12,
        anomalyCount: 1,
        levelCounts: { warn: 3, error: 1, info: 8 },
        anomalyMarkers: [],
        topComponents: [],
        sonificationCues: [],
        parsedLines: ["WARN retry", "ERROR failure"],
        warnings: [],
      },
    });

    expect(state.bounceAction?.label).toContain("12s");
    expect(state.cueEngineStateLabel).toBe(en.inspect.cueEngineBaseSamplePack);
    expect(state.metricGridItems.length).toBeGreaterThan(0);
    expect(state.windowMetricGridItems).toHaveLength(8);
    expect(state.ctaMetaLabel).toContain("Nightfall");
  });

  it("builds playlist and transition slices for the live deck", () => {
    const state = buildLiveLogMonitorPanelPlaylistState({
      availableTracks: [],
      availableBaseTrackOptions: [],
      availablePlaylists: [],
      basePlaylist: { name: "bed", trackIds: [] } as never,
      backgroundNowPlayingTrack: null,
      backgroundTransitionNextTrack: null,
      backgroundTransitionPlan: null,
      liveEnabled: true,
      nowPlayingLabel: en.appShell.nowPlaying,
      upNextLabel: en.appShell.upNext,
      lostLabel: en.library.lost.toUpperCase(),
    });

    expect(state.playlistSummaryItems).toEqual([]);
    expect(state.basePlaylistEditorItems).toEqual([]);
    expect(state.basePlaylistTrackOptions).toEqual([]);
    expect(state.savedPlaylistOptions).toEqual([]);
    expect(state.nowPlayingSummary).toBeNull();
    expect(state.upNextSummary).toBeNull();
  });
});
