import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAppV0SectionContentModel } from "../../src/hooks/useAppV0SectionContentModel";
import type { MonitorLaunchSource } from "../../src/features/simple/monitorSourceOptions";

function createInput() {
  return {
    userMode: "simple" as const,
    lang: "en" as const,
    skin: "nightfall" as const,
    setupPreferences: {
      defaultCloudLookback: "10m",
      idleHoldMs: 900,
      tailWindowRows: 1200,
    },
    updateSetupPreference: vi.fn(),
    setLang: vi.fn(),
    setSkin: vi.fn(),
    currentSection: "monitor" as const,
    setCurrentSection: vi.fn(),
    isSidebarCollapsed: false,
    toggleSidebarCollapsed: vi.fn(),
    isConsoleExpanded: true,
    toggleConsoleExpanded: vi.fn(),
    openMonitorInspector: vi.fn(),
    fallbackViewModel: {
      message: "Nothing here",
      hint: "Use the sidebar",
    },
    shellViewModel: {
      monitoringStatus: {
        source: "visits-service",
        anomalies: 2,
        uptime: "8s",
        confidence: 82,
      },
      selectedItem: "visits-service",
      floatingWaveformBar: {
        isVisible: true,
        source: "visits-service",
        anomalies: 2,
        uptime: "8s",
      },
    },
    waveformBins: [0.2, 0.4, 0.6],
    isMonitoring: true,
    reportMonitorLaunchFailure: vi.fn(),
    monitor: {
      session: {
        sessionId: "session-1",
        persistedSessionId: "persisted-1",
        repoId: "repo-1",
        repoTitle: "visits-service",
        trackId: "track-1",
        trackName: "Deck Track",
        sourcePath: "/logs/visits-service.log",
        adapterKind: "file" as const,
        pollMode: "session" as const,
        startedAt: 1,
      },
      metrics: {
        windowCount: 1,
        processedLines: 12,
        totalAnomalies: 3,
      },
      stopSession: vi.fn(async () => undefined),
      resumeAudio: vi.fn(async () => undefined),
      subscribe: vi.fn(() => vi.fn()),
      audioContext: {
        state: "running",
      } as AudioContext,
    },
    library: {
      tracks: [
        {
          id: "track-1",
          title: "Deck Track",
          sourcePath: "/music/deck-track.wav",
          storagePath: null,
          importedAt: "2026-01-01T00:00:00Z",
          bpm: 126,
          bpmConfidence: 0.9,
          durationSeconds: 320,
          waveformBins: [0.2, 0.4],
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
            sourceKind: "file" as const,
            fileExtension: "wav",
            sizeBytes: 10,
            modifiedAt: null,
            checksum: null,
            availabilityState: "available" as const,
            playbackSource: "source_file" as const,
          },
          tags: {
            title: "Deck Track",
            artist: null,
            album: null,
            genre: null,
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
            waveformBins: [0.2, 0.4],
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
        },
      ],
      selectedTrackId: "track-1",
      selectedTrack: null,
      setSelectedTrackId: vi.fn(),
    },
    repositories: {
      repositories: [
        {
          id: "repo-1",
          title: "visits-service",
          sourcePath: "/logs/visits-service.log",
          storagePath: null,
          sourceKind: "file" as const,
          importedAt: "2026-01-01T00:00:00Z",
          suggestedBpm: 126,
          confidence: 0.9,
          summary: "",
          analyzerStatus: "ready",
          buildSystem: "",
          primaryLanguage: "log",
          javaFileCount: 0,
          testFileCount: 0,
          waveformBins: [],
          beatGrid: [],
          bpmCurve: [],
          notes: [],
          tags: [],
          metrics: {},
        },
      ],
      selectedRepositoryId: "repo-1",
      setSelectedRepositoryId: vi.fn(),
      importRepositorySource: vi.fn(async () => ({ id: "repo-1" })),
    },
    baseAssets: {
      baseAssets: [],
      importLibraryBaseAsset: vi.fn(async () => ({ id: "base-1" })),
    },
    pastSessions: {
      sessions: [
        {
          id: "persisted-1",
          label: "Replay Session",
          sourceId: "repo-1",
          sourceTitle: "visits-service",
          sourcePath: "/logs/visits-service.log",
          sourceKind: "file",
          trackId: "track-1",
          trackTitle: "Deck Track",
          playlistId: null,
          playlistName: null,
          adapterKind: "file",
          mode: "live" as const,
          status: "paused" as const,
          fileCursor: 0,
          totalPolls: 0,
          totalLines: 0,
          totalAnomalies: 0,
          lastBpm: null,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          sourceTemplateId: null,
        },
      ],
    },
    monitorOrchestrator: {
      startLibraryMonitoring: vi.fn(async () => ({ ok: false as const, reason: "library-boom" })),
      startSourceMonitoring: vi.fn(async () => ({ ok: true as const })),
      replaySession: vi.fn(async () => undefined),
    },
  };
}

describe("useAppV0SectionContentModel", () => {
  it("wires import, monitor launch, replay and stop actions through the section content model", async () => {
    const input = createInput();
    const { result } = renderHook(() => useAppV0SectionContentModel(input));

    const source: MonitorLaunchSource = {
      id: "repo-1",
      title: "visits-service",
      sourcePath: "/logs/visits-service.log",
      sourceType: "file",
      sourceTypeLabel: "Log file",
      startable: true,
      origin: "repository",
      repoId: "repo-1",
    };

    await act(async () => {
      expect(
        await result.current.contentActions.onImportRepository({
          sourcePath: "/tmp/repo",
        } as never),
      ).toBe(true);
      expect(
        await result.current.contentActions.onImportBaseAsset({ sourcePath: "/tmp/base" } as never),
      ).toBe(true);
      await result.current.contentActions.onStartLibraryMonitoring("repo-1");
      await result.current.contentActions.onStartMonitoring(source, "track-1");
      await result.current.contentActions.onReplaySession(
        "persisted-1",
        "/logs/visits-service.log",
        "visits-service",
      );
      await result.current.sectionContentInput.onStopMonitor();
    });

    expect(input.repositories.importRepositorySource).toHaveBeenCalledWith(
      expect.objectContaining({ sourcePath: "/tmp/repo" }),
    );
    expect(input.baseAssets.importLibraryBaseAsset).toHaveBeenCalledWith(
      expect.objectContaining({ sourcePath: "/tmp/base" }),
    );
    expect(input.monitorOrchestrator.startLibraryMonitoring).toHaveBeenCalledWith("repo-1");
    expect(input.reportMonitorLaunchFailure).toHaveBeenCalledWith("library", {
      ok: false,
      reason: "library-boom",
    });
    expect(input.monitorOrchestrator.startSourceMonitoring).toHaveBeenCalledWith(source, "track-1");
    expect(input.reportMonitorLaunchFailure).toHaveBeenCalledWith("source", { ok: true });
    expect(input.monitorOrchestrator.replaySession).toHaveBeenCalledWith(
      "persisted-1",
      "/logs/visits-service.log",
      "visits-service",
    );
    expect(input.monitor.stopSession).toHaveBeenCalledTimes(1);
  });

  it("exposes the composed callbacks and monitor state to section content consumers", () => {
    const input = createInput();
    const { result } = renderHook(() => useAppV0SectionContentModel(input));

    expect(result.current.sectionContentInput.currentSection).toBe("monitor");
    expect(result.current.sectionContentInput.onStartLibraryMonitoring).toBe(
      result.current.contentActions.onStartLibraryMonitoring,
    );
    expect(result.current.sectionContentInput.onStartMonitoring).toBe(
      result.current.contentActions.onStartMonitoring,
    );
    expect(result.current.sectionContentInput.onReplaySession).toBe(
      result.current.contentActions.onReplaySession,
    );
    expect(result.current.sectionContentInput.audioStatus).toBe("running");
    expect(result.current.sectionContentInput.monitorTrackName).toBe("Deck Track");
    expect(result.current.sectionContentInput.pastSessions).toHaveLength(1);
  });
});
