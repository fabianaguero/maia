import { describe, expect, it } from "vitest";

import { en } from "../../src/i18n/en";
import { buildLiveLogMonitorPanelViewModel } from "../../src/features/analyzer/components/liveLogMonitorPanelViewModel";

describe("liveLogMonitorPanelViewModel", () => {
  it("builds deck presentation slices from monitor state", () => {
    const model = buildLiveLogMonitorPanelViewModel({
      t: en,
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
      recentMarkers: [],
      syncTailRows: [],
      replayActive: false,
      liveEnabled: true,
      repositorySourcePath: "/logs/fallback.log",
      repositorySuggestedBpm: 124,
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
      availableTracks: [],
      availableBaseTrackOptions: [],
      availablePlaylists: [],
      basePlaylist: null,
      backgroundNowPlayingTrack: null,
      backgroundTransitionNextTrack: null,
      backgroundTransitionPlan: null,
      hasBaseListeningBed: true,
      baseTrackCount: 3,
      playbackPercent: null,
      session: null,
      maxSyncTailLines: 60,
      maxAnomalySourceLines: 6,
    });

    expect(model.deckStatusLabel).toBe(en.appShell.live);
    expect(model.audioBadgeTone).toBe("ready");
    expect(model.bounceAction?.label).toContain("12s");
    expect(model.cueEngineStateLabel).toBe(en.inspect.cueEngineBaseSamplePack);
    expect(model.metricGridItems.length).toBeGreaterThan(0);
    expect(model.windowMetricGridItems.length).toBe(8);
    expect(model.ctaMetaLabel).toContain("Nightfall");
  });
});
