import { describe, expect, it, vi } from "vitest";

import type { LibraryTrack, RepositoryAnalysis } from "../src/types/library";
import type { MonitorLaunchSource } from "../src/types/monitorLaunch";
import { createAppV0MonitorOrchestrator } from "../src/appV0MonitorOrchestration";

const track: LibraryTrack = {
  id: "track-1",
  title: "",
  sourcePath: "/music/around-the-world.mp3",
  storagePath: null,
  importedAt: "2026-01-01T00:00:00Z",
  bpm: 126,
  bpmConfidence: 0.9,
  durationSeconds: 320,
  waveformBins: [0.2, 0.4, 0.6],
  beatGrid: [],
  bpmCurve: [],
  analyzerStatus: "ready",
  repoSuggestedBpm: null,
  repoSuggestedStatus: "none",
  notes: [],
  fileExtension: "mp3",
  analysisMode: "full",
  musicStyleId: "house",
  musicStyleLabel: "House",
  keySignature: null,
  energyLevel: 0.6,
  danceability: 0.8,
  structuralPatterns: [],
  file: {
    sourcePath: "/music/around-the-world.mp3",
    storagePath: null,
    sourceKind: "file",
    fileExtension: "mp3",
    sizeBytes: null,
    modifiedAt: null,
    checksum: null,
    availabilityState: "available",
    playbackSource: "source_file",
  },
  tags: {
    title: "",
    artist: "Daft Punk",
    album: null,
    genre: "House",
    year: null,
    comment: null,
    artworkPath: null,
    musicStyleId: "house",
    musicStyleLabel: "House",
  },
  analysis: {
    importedAt: "2026-01-01T00:00:00Z",
    bpm: 126,
    bpmConfidence: 0.9,
    durationSeconds: 320,
    waveformBins: [0.2, 0.4, 0.6],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    analysisMode: "full",
    analyzerVersion: null,
    analyzedAt: null,
    repoSuggestedBpm: null,
    repoSuggestedStatus: "none",
    notes: [],
    keySignature: null,
    energyLevel: 0.6,
    danceability: 0.8,
    structuralPatterns: [],
  },
  performance: {
    color: null,
    rating: 0,
    playCount: 0,
    lastPlayedAt: null,
    bpmLock: false,
    gridLock: false,
    mainCueSecond: null,
    hotCues: [],
    memoryCues: [],
    savedLoops: [],
  },
};

const repo = {
  id: "repo-1",
  title: "visits-service",
  sourcePath: "/tmp/visits-service.log",
  importedAt: "2026-01-01T00:00:00Z",
  suggestedBpm: null,
  confidence: 0.8,
  summary: "ready",
  analyzerStatus: "ready",
  buildSystem: "spring",
  primaryLanguage: "java",
  javaFileCount: 4,
  testFileCount: 2,
  waveformBins: [],
  beatGrid: [],
  bpmCurve: [],
  notes: [],
  tags: [],
  metrics: {},
  sourceKind: "file",
} satisfies RepositoryAnalysis;

function createOrchestrator() {
  const calls: string[] = [];
  const orchestrator = createAppV0MonitorOrchestrator({
    repositories: [repo],
    tracks: [track],
    selectedTrack: track,
    createSessionId: () => "session-seq",
    setGuideTrack: (path) => {
      calls.push(`guide:${path}`);
    },
    resumeAudio: async () => {
      calls.push("resume");
    },
    startConnection: async ({ connectionId, sessionId }) => {
      calls.push(`connection:${connectionId}:${sessionId}`);
      return {
        sessionId,
        adapterKind: "process",
        source: "gcp-cloud-run://project/service",
        label: "services",
        createdAt: "2026-01-01T00:00:00Z",
        lastPolledAt: null,
        totalPolls: 0,
        fileCursor: null,
      };
    },
    pollConnectionSession: async () => null,
    attachSession: async ({ repoTitle, trackTitle }) => {
      calls.push(`attach:${repoTitle}:${trackTitle}`);
      return true;
    },
    startSession: async (_repository, input) => {
      calls.push(`start:${input.sessionId}:${input.trackTitle}`);
      return true;
    },
    playbackSession: async ({ sessionId, sourcePath, label }) => {
      calls.push(`replay:${sessionId}:${sourcePath}:${label}`);
    },
    onLaunchSuccess: () => {
      calls.push("success");
    },
  });

  return { orchestrator, calls };
}

describe("appV0MonitorOrchestration", () => {
  it("starts repository monitoring through the orchestration layer", async () => {
    const { orchestrator, calls } = createOrchestrator();

    const result = await orchestrator.startLibraryMonitoring("repo-1");

    expect(result).toEqual({ ok: true });
    expect(calls).toEqual([
      "guide:/music/around-the-world.mp3",
      "resume",
      "start:session-seq:around-the-world.mp3",
      "success",
    ]);
  });

  it("starts connection monitoring through the orchestration layer", async () => {
    const { orchestrator, calls } = createOrchestrator();
    const source: MonitorLaunchSource = {
      id: "connection:cloud-1",
      title: "services",
      sourcePath: "gcp-cloud-run://project/service",
      sourceType: "cloud",
      sourceTypeLabel: "Cloud",
      startable: true,
      origin: "connection",
      connectionId: "cloud-1",
    };

    const result = await orchestrator.startSourceMonitoring(source, "track-1");

    expect(result).toEqual({ ok: true });
    expect(calls).toEqual([
      "guide:/music/around-the-world.mp3",
      "resume",
      "connection:cloud-1:session-seq",
      "attach:services:around-the-world.mp3",
      "success",
    ]);
  });

  it("replays a persisted session through the shared playback contract", async () => {
    const { orchestrator, calls } = createOrchestrator();

    await orchestrator.replaySession("session-9", "/tmp/visits-service.log", "visits-service");

    expect(calls).toEqual([
      "guide:/music/around-the-world.mp3",
      "resume",
      "replay:session-9:/tmp/visits-service.log:visits-service",
    ]);
  });

  it("surfaces invalid repository launches without executing runtime deps", async () => {
    const setGuideTrack = vi.fn();
    const resumeAudio = vi.fn();
    const orchestrator = createAppV0MonitorOrchestrator({
      repositories: [],
      tracks: [track],
      selectedTrack: track,
      createSessionId: () => "session-bad",
      setGuideTrack,
      resumeAudio,
      startConnection: vi.fn(),
      attachSession: vi.fn(),
      startSession: vi.fn(),
      playbackSession: vi.fn(),
    });

    const result = await orchestrator.startLibraryMonitoring("missing");

    expect(result).toEqual({ ok: false, reason: "missing-repository" });
    expect(setGuideTrack).not.toHaveBeenCalled();
    expect(resumeAudio).not.toHaveBeenCalled();
  });

  it("surfaces missing-track launches without executing runtime deps", async () => {
    const setGuideTrack = vi.fn();
    const resumeAudio = vi.fn();
    const orchestrator = createAppV0MonitorOrchestrator({
      repositories: [repo],
      tracks: [],
      selectedTrack: null,
      createSessionId: () => "session-no-track",
      setGuideTrack,
      resumeAudio,
      startConnection: vi.fn(),
      attachSession: vi.fn(),
      startSession: vi.fn(),
      playbackSession: vi.fn(),
    });

    const result = await orchestrator.startLibraryMonitoring("repo-1");

    expect(result).toEqual({ ok: false, reason: "missing-track" });
    expect(setGuideTrack).not.toHaveBeenCalled();
    expect(resumeAudio).not.toHaveBeenCalled();
  });

  it("surfaces attach failures for connection launches", async () => {
    const orchestrator = createAppV0MonitorOrchestrator({
      repositories: [repo],
      tracks: [track],
      selectedTrack: track,
      createSessionId: () => "session-attach-fail",
      setGuideTrack: vi.fn(),
      resumeAudio: vi.fn(async () => undefined),
      startConnection: vi.fn(async ({ sessionId }) => ({
        sessionId,
        adapterKind: "process",
        source: "gcp-cloud-run://project/service",
        label: "services",
        createdAt: "2026-01-01T00:00:00Z",
        lastPolledAt: null,
        totalPolls: 0,
        fileCursor: null,
      })),
      pollConnectionSession: vi.fn(async () => null),
      attachSession: vi.fn(async () => false),
      startSession: vi.fn(async () => true),
      playbackSession: vi.fn(),
      onLaunchSuccess: vi.fn(),
    });

    const source: MonitorLaunchSource = {
      id: "connection:cloud-2",
      title: "services",
      sourcePath: "gcp-cloud-run://project/service",
      sourceType: "cloud",
      sourceTypeLabel: "Cloud",
      startable: true,
      origin: "connection",
      connectionId: "cloud-2",
    };

    const result = await orchestrator.startSourceMonitoring(source, "track-1");

    expect(result).toEqual({ ok: false, reason: "attach-failed" });
  });

  it("surfaces start failures for repository launches", async () => {
    const onLaunchSuccess = vi.fn();
    const orchestrator = createAppV0MonitorOrchestrator({
      repositories: [repo],
      tracks: [track],
      selectedTrack: track,
      createSessionId: () => "session-start-fail",
      setGuideTrack: vi.fn(),
      resumeAudio: vi.fn(async () => undefined),
      startConnection: vi.fn(),
      attachSession: vi.fn(async () => true),
      startSession: vi.fn(async () => false),
      playbackSession: vi.fn(),
      onLaunchSuccess,
    });

    const result = await orchestrator.startLibraryMonitoring("repo-1");

    expect(result).toEqual({ ok: false, reason: "start-failed" });
    expect(onLaunchSuccess).not.toHaveBeenCalled();
  });
});
