import { describe, expect, it } from "vitest";

import type { RepositoryAnalysis } from "../../../../src/types/library";
import {
  buildLiveMonitorStartResetState,
  buildSequencerPreviewCues,
  createLiveMonitorSessionInput,
  resolveBeatClockSeed,
  resolveLiveDeckStatusLabel,
  resolveLiveMonitorStartAudioPlan,
  resolveLiveMonitorCtaMeta,
} from "../../../../src/features/analyzer/components/liveLogMonitorSessionRuntime";

function createRepository(): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "visits-service",
    sourcePath: "/logs/visits-service.log",
    storagePath: null,
    sourceKind: "file",
    importedAt: "2026-06-26T00:00:00.000Z",
    suggestedBpm: 126,
    confidence: 0.8,
    summary: "service tail",
    analyzerStatus: "ready",
    buildSystem: "unknown",
    primaryLanguage: "log",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags: [],
    metrics: {},
  };
}

describe("liveLogMonitorSessionRuntime", () => {
  it("builds the start-session input and beat clock seed", () => {
    expect(createLiveMonitorSessionInput(createRepository(), "sess-1")).toEqual({
      sessionId: "sess-1",
      adapterKind: "file",
      source: "/logs/visits-service.log",
      label: "visits-service",
      startFromBeginning: true,
    });

    expect(resolveBeatClockSeed(12.5, 126)).toEqual({
      originTime: 12.5,
      bpm: 126,
    });
    expect(resolveBeatClockSeed(null, 126)).toBeNull();
    expect(resolveBeatClockSeed(12.5, 0)).toBeNull();
  });

  it("builds monitor start reset state and audio boot plan", () => {
    expect(buildLiveMonitorStartResetState()).toEqual({
      emittedCueCount: 0,
      backgroundPlayheadSecond: 0,
      activeTailWindowId: null,
      error: null,
      isStarting: true,
      bounceWindowCount: 0,
    });

    expect(
      resolveLiveMonitorStartAudioPlan({
        contextTime: 8,
        anchorBpm: 126,
        useBeatGrid: true,
      }),
    ).toEqual({
      beatClockSeed: {
        originTime: 8,
        bpm: 126,
      },
      beatClockBpm: 126,
      shouldStartBeatLooper: true,
      beatLooperBpm: 126,
    });

    expect(
      resolveLiveMonitorStartAudioPlan({
        contextTime: null,
        anchorBpm: null,
        useBeatGrid: false,
      }),
    ).toEqual({
      beatClockSeed: null,
      beatClockBpm: null,
      shouldStartBeatLooper: false,
      beatLooperBpm: null,
    });
  });

  it("derives deck labels and CTA copy", () => {
    expect(
      resolveLiveDeckStatusLabel({
        replayActive: true,
        liveEnabled: false,
        replayLabel: "Replay",
        liveLabel: "Live",
        stoppedLabel: "Stopped",
      }),
    ).toBe("Replay");

    expect(
      resolveLiveMonitorCtaMeta({
        hasBaseListeningBed: true,
        baseTrackCount: 2,
        soundsLabel: "Sonidos",
        armedLabel: "Armado",
        notArmedLabel: "No armado",
        basePlaylistLabel: "Playlist base",
        styleLabel: "Steady House",
        mutationLabel: "Balanced",
      }),
    ).toBe("2 sonidos armado · Steady House · Balanced");
  });

  it("builds sequencer preview cues from firings", () => {
    const cues = buildSequencerPreviewCues([
      { track: "foundation", step: 0, humanizeOffsetMs: 0 },
      { track: "accent", step: 1, humanizeOffsetMs: 8 },
    ]);

    expect(cues).toHaveLength(2);
    expect(cues[0]?.noteHz).toBe(80);
    expect(cues[1]?.waveform).toBe("sine");
    expect(cues[1]?.routeLabel).toBe("accent");
  });
});
