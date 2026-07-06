import { describe, expect, it, vi } from "vitest";

import {
  buildAppV0MonitorOrchestrationDeps,
  buildAppV0MonitorOrchestratorInput,
  buildAppV0MonitorOrchestrator,
  buildAppV0MonitorShellViewModelInput,
  buildAppV0MonitorStateContext,
  buildAppV0MonitorStateModelInput,
  buildAppV0MonitorStateModel,
  createAppV0MonitorSessionIdFactory,
  resolveAppV0Translations,
} from "../../src/hooks/appV0MonitorScreenStateRuntime";
import type { RepositoryAnalysis, LibraryTrack } from "../../src/types/library";

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

function createTrack(): LibraryTrack {
  return {
    id: "track-1",
    title: "Deck Track",
    sourcePath: "/music/deck-track.wav",
    storagePath: null,
    importedAt: "2026-06-25T20:00:00.000Z",
    bpm: 126,
    bpmConfidence: 0.8,
    durationSeconds: 240,
    waveformBins: [0.1, 0.2],
    beatGrid: [],
    bpmCurve: [],
    analyzerStatus: "ready",
    repoSuggestedBpm: null,
    repoSuggestedStatus: "idle",
    notes: [],
    fileExtension: "wav",
    analysisMode: "track",
    musicStyleId: "house",
    musicStyleLabel: "House",
    keySignature: null,
    energyLevel: null,
    danceability: null,
    structuralPatterns: [],
    file: {
      sourcePath: "/music/deck-track.wav",
      storagePath: null,
      sourceKind: "file",
      fileExtension: "wav",
      sizeBytes: 1024,
      modifiedAt: null,
      checksum: null,
      availabilityState: "available",
      playbackSource: "source_file",
    },
    tags: {
      title: "Deck Track",
      artist: "Maia",
      album: null,
      genre: "House",
      year: null,
      comment: null,
      artworkPath: null,
      musicStyleId: "house",
      musicStyleLabel: "House",
    },
    analysis: {
      importedAt: "2026-06-25T20:00:00.000Z",
      bpm: 126,
      bpmConfidence: 0.8,
      durationSeconds: 240,
      waveformBins: [0.1, 0.2],
      beatGrid: [],
      bpmCurve: [],
      analyzerStatus: "ready",
      analysisMode: "track",
      analyzerVersion: null,
      analyzedAt: null,
      repoSuggestedBpm: null,
      repoSuggestedStatus: "idle",
      notes: [],
      keySignature: null,
      energyLevel: null,
      danceability: null,
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

describe("appV0MonitorScreenStateRuntime", () => {
  it("builds localized screen model data", () => {
    const track = createTrack();
    const modelInput = buildAppV0MonitorStateModelInput({
      lang: "es",
      currentSection: "monitor",
      selectedRepositoryTitle: "visits-service",
      selectedTrack: track,
      tracks: [track],
      session: {
        id: "session-1",
        sourcePath: "/logs/visits-service.log",
        repoTitle: "visits-service",
        startedAt: Date.UTC(2026, 5, 25, 20, 0, 0),
        adapterKind: "file",
        totalLines: 10,
        totalAnomalies: 1,
        trackId: "track-1",
        trackName: "Deck Track",
      },
      metrics: {
        windowCount: 1,
        processedLines: 10,
        totalAnomalies: 1,
      },
    });
    const context = buildAppV0MonitorStateContext(modelInput);
    const shellInput = buildAppV0MonitorShellViewModelInput(modelInput, context);
    const model = buildAppV0MonitorStateModel(modelInput);

    expect(resolveAppV0Translations("es").simpleMode.nav.monitor).toBeDefined();
    expect(modelInput.selectedRepositoryTitle).toBe("visits-service");
    expect(context.isMonitoring).toBe(true);
    expect(shellInput.selectedTrackTitle).toBe("Deck Track");
    expect(model.isMonitoring).toBe(true);
    expect(model.waveformBins).toEqual([0.1, 0.2]);
    expect(model.fallbackViewModel.message.length).toBeGreaterThan(0);
  });

  it("builds an orchestrator with monitor launch methods", () => {
    const orchestratorInput = buildAppV0MonitorOrchestratorInput({
      repositories: [createRepository()],
      tracks: [createTrack()],
      selectedTrack: createTrack(),
      setGuideTrack: vi.fn(),
      resumeAudio: vi.fn(async () => undefined),
      attachSession: vi.fn(async () => true),
      startSession: vi.fn(async () => true),
      playbackSession: vi.fn(async () => true),
      onLaunchSuccess: vi.fn(),
    });
    const sessionIdFactory = createAppV0MonitorSessionIdFactory();
    const orchestrationDeps = buildAppV0MonitorOrchestrationDeps(orchestratorInput);
    const orchestrator = buildAppV0MonitorOrchestrator(orchestratorInput);

    expect(orchestratorInput.repositories).toHaveLength(1);
    expect(typeof sessionIdFactory()).toBe("string");
    expect(orchestrationDeps.repositories).toHaveLength(1);
    expect(typeof orchestrationDeps.createSessionId()).toBe("string");
    expect(typeof orchestrator.startLibraryMonitoring).toBe("function");
    expect(typeof orchestrator.startSourceMonitoring).toBe("function");
    expect(typeof orchestrator.replaySession).toBe("function");
  });
});
