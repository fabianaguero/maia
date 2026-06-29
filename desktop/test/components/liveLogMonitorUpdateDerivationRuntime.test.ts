import { describe, expect, it } from "vitest";

import type { LibraryTrack, LiveLogCue, LiveLogStreamUpdate } from "../../src/types/library";
import { buildMonitorUpdateDerivation } from "../../src/features/analyzer/components/liveLogMonitorUpdateDerivationRuntime";
import { resolveLiveSonificationScene } from "../../src/features/analyzer/components/liveSonificationScene";

function createTrack(id: string): LibraryTrack {
  return {
    id,
    filePath: `/tmp/${id}.wav`,
    analysisPath: null,
    tags: {
      title: `Track ${id}`,
      artist: "MAIA",
      album: null,
      genre: "House",
      musicStyleId: null,
      bpm: null,
      key: null,
      durationSec: 180,
    },
    analysis: {
      bpm: 124,
      energy: 0.6,
      waveformBins: [0.2, 0.4, 0.7],
      beatGrid: [],
      key: null,
      loudnessDb: -9,
      durationSec: 180,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createCue(id: string, overrides: Partial<LiveLogCue> = {}): LiveLogCue {
  return {
    id,
    level: "WARN",
    component: "billing",
    excerpt: "WARN billing issue",
    timestamp: Date.now(),
    noteHz: 330,
    durationMs: 180,
    gain: 0.3,
    pan: 0,
    waveform: "triangle",
    accent: "normal",
    routeKey: "warn",
    traceId: null,
    sourceLabel: "services",
    eventIndex: 0,
    voiceName: "warn",
    trackId: "track-1",
    componentName: "billing",
    sourceLine: "WARN billing issue",
    markerId: null,
    ...overrides,
  };
}

function createUpdate(): LiveLogStreamUpdate {
  return {
    hasData: true,
    lineCount: 2,
    anomalyCount: 1,
    topComponents: [{ component: "billing", count: 2 }],
    warnings: [],
    suggestedBpm: 124,
    parsedLines: ["one", "two"],
    anomalyMarkers: [],
    sonificationCues: [createCue("cue-1"), createCue("cue-2", { componentName: "api" })],
    replayWindowIndex: null,
    cueEngineState: null,
  };
}

describe("liveLogMonitorUpdateDerivationRuntime", () => {
  it("derives routed cues, known components and primary line from an update", () => {
    const scene = resolveLiveSonificationScene(null, null, null, null, null);
    const track = createTrack("track-1");
    const result = buildMonitorUpdateDerivation({
      update: createUpdate(),
      scene,
      knownComponents: ["jobs"],
      componentOverrides: new Map(),
      currentDeckTrackId: track.id,
      availableTracks: [track],
      currentTrackSecond: 12.2,
      maxRecentExplanations: 6,
    });

    expect(result.knownComponents).toContain("billing");
    expect(result.knownComponentsChanged).toBe(true);
    expect(result.routedCues).toHaveLength(2);
    expect(result.currentTrack?.id).toBe("track-1");
    expect(result.primaryLine).toBe("two");
  });
});
