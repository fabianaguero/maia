import { describe, expect, it, vi } from "vitest";

vi.mock("../src/api/repositories", () => ({
  pollStreamSession: vi.fn(async () => ({
    sourcePath: "gcp-cloud-run://project/service",
    fromOffset: 0,
    toOffset: 0,
    hasData: false,
    summary: "",
    suggestedBpm: null,
    confidence: 0,
    dominantLevel: "info",
    lineCount: 0,
    anomalyCount: 0,
    levelCounts: {},
    anomalyMarkers: [],
    topComponents: [],
    sonificationCues: [],
    parsedLines: [],
    warnings: [],
  })),
}));

import type { MonitorLaunchSource } from "../src/types/monitorLaunch";
import {
  buildAppV0MonitorLaunchExecutionDeps,
  replayAppV0MonitorSession,
  startAppV0LibraryMonitoring,
  startAppV0SourceMonitoring,
  type AppV0MonitorOrchestrationRuntimeDeps,
} from "../src/appV0MonitorOrchestrationRuntime";

const track = {
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
  analysisMode: "full" as const,
  musicStyleId: "house",
  musicStyleLabel: "House",
  keySignature: null,
  energyLevel: 0.6,
  danceability: 0.8,
  structuralPatterns: [],
  file: {
    sourcePath: "/music/around-the-world.mp3",
    storagePath: null,
    sourceKind: "file" as const,
    fileExtension: "mp3",
    sizeBytes: null,
    modifiedAt: null,
    checksum: null,
    availabilityState: "available" as const,
    playbackSource: "source_file" as const,
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
    analyzerStatus: "ready" as const,
    analysisMode: "full" as const,
    analyzerVersion: null,
    analyzedAt: null,
    repoSuggestedBpm: null,
    repoSuggestedStatus: "none" as const,
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
  analyzerStatus: "ready" as const,
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
  sourceKind: "file" as const,
};

function createDeps(
  overrides: Partial<AppV0MonitorOrchestrationRuntimeDeps> = {},
): AppV0MonitorOrchestrationRuntimeDeps {
  return {
    repositories: [repo],
    tracks: [track],
    selectedTrack: track,
    createSessionId: () => "session-seq",
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
    attachSession: vi.fn(async () => true),
    startSession: vi.fn(async () => true),
    playbackSession: vi.fn(async () => undefined),
    onLaunchSuccess: vi.fn(),
    ...overrides,
  };
}

describe("appV0MonitorOrchestrationRuntime", () => {
  it("builds the execution deps contract from orchestration deps", () => {
    const deps = createDeps();
    const executionDeps = buildAppV0MonitorLaunchExecutionDeps(deps);

    expect(executionDeps.setGuideTrack).toBe(deps.setGuideTrack);
    expect(executionDeps.resumeAudio).toBe(deps.resumeAudio);
    expect(executionDeps.startConnection).toBe(deps.startConnection);
    expect(executionDeps.attachSession).toBe(deps.attachSession);
    expect(executionDeps.startSession).toBe(deps.startSession);
    expect(executionDeps.onLaunchSuccess).toBe(deps.onLaunchSuccess);
  });

  it("starts repository monitoring through the shared runtime helper", async () => {
    const deps = createDeps();

    const result = await startAppV0LibraryMonitoring(deps, "repo-1");

    expect(result).toEqual({ ok: true });
    expect(deps.startSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: "repo-1" }),
      expect.objectContaining({
        sessionId: "session-seq",
        source: "/tmp/visits-service.log",
        trackId: "track-1",
      }),
    );
  });

  it("starts source monitoring through the shared runtime helper", async () => {
    const deps = createDeps();
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

    const result = await startAppV0SourceMonitoring(deps, source, "track-1");

    expect(result).toEqual({ ok: true });
    expect(deps.startConnection).toHaveBeenCalledWith({
      connectionId: "cloud-1",
      sessionId: "session-seq",
      startFromBeginning: false,
    });
    expect(deps.attachSession).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: "connection:cloud-1",
        repoTitle: "services",
        trackId: "track-1",
      }),
    );
  });

  it("replays persisted sessions through the shared runtime helper", async () => {
    const deps = createDeps();

    await replayAppV0MonitorSession(
      deps,
      "session-9",
      "/tmp/visits-service.log",
      "visits-service",
      "track-1",
    );

    expect(deps.setGuideTrack).toHaveBeenCalledWith("/music/around-the-world.mp3");
    expect(deps.resumeAudio).toHaveBeenCalled();
    expect(deps.playbackSession).toHaveBeenCalledWith({
      sessionId: "session-9",
      sourcePath: "/tmp/visits-service.log",
      label: "visits-service",
      trackId: "track-1",
      trackTitle: "around-the-world.mp3",
    });
  });
});
