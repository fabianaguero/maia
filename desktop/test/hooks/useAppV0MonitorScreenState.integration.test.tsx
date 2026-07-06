import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { useAppV0MonitorScreenState } from "../../src/hooks/useAppV0MonitorScreenState";
import type { LibraryTrack, RepositoryAnalysis } from "../../src/types/library";
import type { MonitorLaunchSource } from "../../src/types/monitorLaunch";
import type { StreamSessionRecord } from "../../src/types/monitor";

const repositoriesApiMock = vi.hoisted(() => ({
  startLogSourceConnection:
    vi.fn<
      (input: {
        connectionId: string;
        sessionId: string;
        startFromBeginning?: boolean;
      }) => Promise<StreamSessionRecord>
    >(),
}));

vi.mock("../../src/api/repositories", () => repositoriesApiMock);

function createTrack(): LibraryTrack {
  return {
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
}

function createRepository(): RepositoryAnalysis {
  return {
    id: "repo-1",
    title: "visits-service",
    sourcePath: "/logs/visits-service.log",
    storagePath: null,
    sourceKind: "file",
    importedAt: "2026-06-25T20:00:00.000Z",
    suggestedBpm: 126,
    confidence: 0.82,
    summary: "steady pulse",
    analyzerStatus: "ready",
    buildSystem: "none",
    primaryLanguage: "logs",
    javaFileCount: 0,
    testFileCount: 0,
    waveformBins: [0.2, 0.3],
    beatGrid: [],
    bpmCurve: [],
    notes: [],
    tags: [],
    metrics: {},
  };
}

describe("useAppV0MonitorScreenState integration", () => {
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        ...originalCrypto,
        randomUUID: () => "session-seq",
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: originalCrypto,
    });
  });

  it("launches repository monitoring through the hook orchestrator and switches to monitor", async () => {
    const repository = createRepository();
    const track = createTrack();
    const setCurrentSection = vi.fn();
    const setGuideTrack = vi.fn();
    const resumeAudio = vi.fn(async () => undefined);
    const startSession = vi.fn(async () => true);

    const { result } = renderHook(() =>
      useAppV0MonitorScreenState({
        lang: "en",
        currentSection: "library",
        setCurrentSection,
        repositories: [repository],
        selectedRepositoryTitle: repository.title,
        tracks: [track],
        selectedTrack: track,
        session: null,
        metrics: {
          windowCount: 0,
          processedLines: 0,
          totalAnomalies: 0,
        },
        setGuideTrack,
        resumeAudio,
        attachSession: vi.fn(async () => true),
        startSession,
        playbackSession: vi.fn(async () => true),
      }),
    );

    const launchResult = await act(async () =>
      result.current.monitorOrchestrator.startLibraryMonitoring(repository.id),
    );

    expect(launchResult).toEqual({ ok: true });
    expect(setGuideTrack).toHaveBeenCalledWith("/music/around-the-world.mp3");
    expect(resumeAudio).toHaveBeenCalledTimes(1);
    expect(startSession).toHaveBeenCalledWith(
      repository,
      expect.objectContaining({
        sessionId: "session-seq",
        source: "/logs/visits-service.log",
        trackId: track.id,
        trackTitle: "around-the-world.mp3",
      }),
    );
    expect(setCurrentSection).toHaveBeenCalledWith("monitor");
  });

  it("launches connection monitoring through the hook orchestrator and attaches the session", async () => {
    const repository = createRepository();
    const track = createTrack();
    const attachSession = vi.fn(async () => true);
    const setCurrentSection = vi.fn();

    repositoriesApiMock.startLogSourceConnection.mockResolvedValue({
      sessionId: "session-seq",
      adapterKind: "process",
      source: "gcp-cloud-run://project/service",
      label: "services",
      createdAt: "2026-01-01T00:00:00Z",
      lastPolledAt: null,
      totalPolls: 0,
      fileCursor: null,
    });

    const { result } = renderHook(() =>
      useAppV0MonitorScreenState({
        lang: "en",
        currentSection: "connections",
        setCurrentSection,
        repositories: [repository],
        selectedRepositoryTitle: null,
        tracks: [track],
        selectedTrack: track,
        session: null,
        metrics: {
          windowCount: 0,
          processedLines: 0,
          totalAnomalies: 0,
        },
        setGuideTrack: vi.fn(),
        resumeAudio: vi.fn(async () => undefined),
        attachSession,
        startSession: vi.fn(async () => true),
        playbackSession: vi.fn(async () => true),
      }),
    );

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

    const launchResult = await act(async () =>
      result.current.monitorOrchestrator.startSourceMonitoring(source, track.id),
    );

    expect(launchResult).toEqual({ ok: true });
    expect(repositoriesApiMock.startLogSourceConnection).toHaveBeenCalledWith({
      connectionId: "cloud-1",
      sessionId: "session-seq",
      startFromBeginning: false,
    });
    expect(attachSession).toHaveBeenCalledWith({
      session: expect.objectContaining({
        sessionId: "session-seq",
        label: "services",
      }),
      repoId: source.id,
      repoTitle: source.title,
      trackId: track.id,
      trackTitle: "around-the-world.mp3",
    });
    expect(setCurrentSection).toHaveBeenCalledWith("monitor");
  });
});
