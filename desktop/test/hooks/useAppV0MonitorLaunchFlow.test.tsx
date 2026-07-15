import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MonitorLaunchSource } from "../../src/types/monitorLaunch";
import { useAppV0MonitorScreenState } from "../../src/hooks/useAppV0MonitorScreenState";
import type { LibraryTrack, RepositoryAnalysis } from "../../src/types/library";

const repositoriesApiMock = vi.hoisted(() => ({
  startLogSourceConnection: vi.fn(),
  pollStreamSession: vi.fn(),
}));

vi.mock("../../src/api/repositories", () => ({
  startLogSourceConnection: repositoriesApiMock.startLogSourceConnection,
  pollStreamSession: repositoriesApiMock.pollStreamSession,
}));

const emptyPollResult = {
  sourcePath: "gcp-cloud-run://project/services",
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
};

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
    sourcePath: "/tmp/visits-service.log",
    sourceKind: "file",
    importedAt: "2026-01-01T00:00:00Z",
    lastAnalyzedAt: null,
    analyzerStatus: "ready",
    techStackSummary: [],
    fileCount: 0,
    totalLines: 0,
    entryPoints: [],
    dominantLanguages: [],
    suggestedMusicStyleId: null,
    suggestedMusicStyleLabel: null,
    suggestedBpm: null,
    suggestedBpmReason: null,
    notes: [],
  };
}

describe("useAppV0MonitorScreenState launch flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositoriesApiMock.pollStreamSession.mockResolvedValue(emptyPollResult);
  });

  it("switches to the active monitor section after a successful connection launch", async () => {
    const setCurrentSection = vi.fn();
    const setGuideTrack = vi.fn();
    const resumeAudio = vi.fn(async () => undefined);
    const attachSession = vi.fn(async () => true);
    const startSession = vi.fn(async () => true);
    const playbackSession = vi.fn(async () => true);
    const track = createTrack();

    repositoriesApiMock.startLogSourceConnection.mockResolvedValue({
      sessionId: "session-cloud-1",
      adapterKind: "process",
      source: "gcp-cloud-run://project/services",
      label: "services",
      createdAt: "2026-01-01T00:00:00Z",
      lastPolledAt: null,
      totalPolls: 0,
      fileCursor: null,
    });
    const { result } = renderHook(() =>
      useAppV0MonitorScreenState({
        lang: "en",
        currentSection: "library",
        setCurrentSection,
        repositories: [createRepository()],
        selectedRepositoryTitle: "visits-service",
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
        attachSession,
        startSession,
        playbackSession,
      }),
    );

    const source: MonitorLaunchSource = {
      id: "connection:cloud-1",
      title: "services",
      sourcePath: "gcp-cloud-run://project/services",
      sourceType: "cloud",
      sourceTypeLabel: "Cloud",
      startable: true,
      origin: "connection",
      connectionId: "cloud-1",
    };

    let launchResult:
      | Awaited<ReturnType<typeof result.current.monitorOrchestrator.startSourceMonitoring>>
      | undefined;

    await act(async () => {
      launchResult = await result.current.monitorOrchestrator.startSourceMonitoring(
        source,
        "track-1",
      );
    });

    expect(launchResult).toEqual({ ok: true });
    expect(setGuideTrack).toHaveBeenCalledWith("/music/around-the-world.mp3");
    expect(resumeAudio).toHaveBeenCalledTimes(1);
    expect(repositoriesApiMock.startLogSourceConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: "cloud-1",
        startFromBeginning: true,
      }),
    );
    expect(attachSession).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: "connection:cloud-1",
        repoTitle: "services",
        trackId: "track-1",
        trackTitle: "around-the-world.mp3",
      }),
    );
    expect(setCurrentSection).toHaveBeenCalledWith("monitor");
    expect(startSession).not.toHaveBeenCalled();
  });

  it("does not switch to the active monitor section when a connection launch cannot attach", async () => {
    const setCurrentSection = vi.fn();
    const setGuideTrack = vi.fn();
    const resumeAudio = vi.fn(async () => undefined);
    const attachSession = vi.fn(async () => false);
    const startSession = vi.fn(async () => true);
    const playbackSession = vi.fn(async () => true);
    const track = createTrack();

    repositoriesApiMock.startLogSourceConnection.mockResolvedValue({
      sessionId: "session-cloud-2",
      adapterKind: "process",
      source: "gcp-cloud-run://project/services",
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
        repositories: [createRepository()],
        selectedRepositoryTitle: "visits-service",
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
        attachSession,
        startSession,
        playbackSession,
      }),
    );

    const source: MonitorLaunchSource = {
      id: "connection:cloud-2",
      title: "services",
      sourcePath: "gcp-cloud-run://project/services",
      sourceType: "cloud",
      sourceTypeLabel: "Cloud",
      startable: true,
      origin: "connection",
      connectionId: "cloud-2",
    };

    let launchResult:
      | Awaited<ReturnType<typeof result.current.monitorOrchestrator.startSourceMonitoring>>
      | undefined;

    await act(async () => {
      launchResult = await result.current.monitorOrchestrator.startSourceMonitoring(
        source,
        "track-1",
      );
    });

    expect(launchResult).toEqual({ ok: false, reason: "attach-failed" });
    expect(setGuideTrack).toHaveBeenCalledWith("/music/around-the-world.mp3");
    expect(resumeAudio).toHaveBeenCalledTimes(1);
    expect(repositoriesApiMock.startLogSourceConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: "cloud-2",
        startFromBeginning: true,
      }),
    );
    expect(attachSession).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: "connection:cloud-2",
        repoTitle: "services",
        trackId: "track-1",
        trackTitle: "around-the-world.mp3",
      }),
    );
    expect(setCurrentSection).not.toHaveBeenCalledWith("monitor");
    expect(startSession).not.toHaveBeenCalled();
  });

  it("switches to the active monitor section after a successful repository launch", async () => {
    const setCurrentSection = vi.fn();
    const setGuideTrack = vi.fn();
    const resumeAudio = vi.fn(async () => undefined);
    const attachSession = vi.fn(async () => true);
    const startSession = vi.fn(async () => true);
    const playbackSession = vi.fn(async () => true);
    const track = createTrack();

    const { result } = renderHook(() =>
      useAppV0MonitorScreenState({
        lang: "en",
        currentSection: "library",
        setCurrentSection,
        repositories: [createRepository()],
        selectedRepositoryTitle: "visits-service",
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
        attachSession,
        startSession,
        playbackSession,
      }),
    );

    let launchResult:
      | Awaited<ReturnType<typeof result.current.monitorOrchestrator.startLibraryMonitoring>>
      | undefined;

    await act(async () => {
      launchResult = await result.current.monitorOrchestrator.startLibraryMonitoring("repo-1");
    });

    expect(launchResult).toEqual({ ok: true });
    expect(setGuideTrack).toHaveBeenCalledWith("/music/around-the-world.mp3");
    expect(resumeAudio).toHaveBeenCalledTimes(1);
    expect(startSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "repo-1",
        title: "visits-service",
      }),
      expect.objectContaining({
        source: "/tmp/visits-service.log",
        adapterKind: "file",
        trackId: "track-1",
        trackTitle: "around-the-world.mp3",
        startFromBeginning: true,
      }),
    );
    expect(setCurrentSection).toHaveBeenCalledWith("monitor");
    expect(attachSession).not.toHaveBeenCalled();
  });
});
