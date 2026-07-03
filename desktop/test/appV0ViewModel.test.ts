import { describe, expect, it, vi } from "vitest";

import type { ActiveMonitorSession } from "../src/features/monitor/MonitorContext";
import { en } from "../src/i18n/en";
import type { LibraryTrack } from "../src/types/library";
import {
  buildAppV0FallbackViewModel,
  buildAppV0ContentActions,
  buildAppV0ScreenModel,
  buildAppV0SectionContentInput,
  buildAppV0ShellProps,
  createAppV0SessionId,
  formatAppV0Uptime,
  resolveAppV0MonitoringSourceLabel,
  resolveAppV0MonitorWaveformBins,
} from "../src/appV0ViewModel";

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

describe("appV0ViewModel", () => {
  it("formats uptime safely", () => {
    expect(formatAppV0Uptime(null)).toBe("0s");
    expect(formatAppV0Uptime(1_000, 9_000)).toBe("8s");
    expect(formatAppV0Uptime(1_000, 71_000)).toBe("1m 10s");
  });

  it("creates session ids deterministically", () => {
    expect(createAppV0SessionId({ randomUUID: () => "uuid-1" })).toBe("uuid-1");
    expect(createAppV0SessionId({ nowMs: 123, randomValue: 7 })).toBe("session-123-7");
  });

  it("resolves fallback copy and monitoring source labels", () => {
    const session = {
      repoTitle: "visits-service",
    } as ActiveMonitorSession;

    expect(buildAppV0FallbackViewModel(en)).toEqual({
      message: en.simpleMode.common.sectionNotImplemented,
      hint: en.simpleMode.common.useSidebarNavigation,
    });
    expect(resolveAppV0MonitoringSourceLabel(session, en)).toBe("visits-service");
    expect(resolveAppV0MonitoringSourceLabel(null, en)).toBe(en.simpleMode.common.unknown);
  });

  it("resolves waveform bins from session track id or title fallback", () => {
    expect(
      resolveAppV0MonitorWaveformBins({
        tracks: [track],
        sessionTrackId: "track-1",
        sessionTrackName: null,
      }),
    ).toEqual([0.2, 0.4, 0.6]);

    expect(
      resolveAppV0MonitorWaveformBins({
        tracks: [track],
        sessionTrackId: null,
        sessionTrackName: "around-the-world.mp3",
      }),
    ).toEqual([0.2, 0.4, 0.6]);
  });

  it("builds app content callbacks that only report failed monitor orchestration results", async () => {
    const setCurrentSection = vi.fn();
    const stopSession = vi.fn(async () => undefined);
    const importRepositorySource = vi.fn(async () => ({ id: "repo-1" }));
    const importLibraryBaseAsset = vi.fn(async () => null);
    const startLibraryMonitoring = vi.fn(async () => ({
      ok: false as const,
      reason: "start-failed" as const,
    }));
    const startSourceMonitoring = vi.fn(async () => ({ ok: true as const }));
    const reportMonitorLaunchFailure = vi.fn();
    const resumeAudio = vi.fn(async () => undefined);
    const replaySession = vi.fn(async () => undefined);

    const actions = buildAppV0ContentActions({
      setCurrentSection,
      stopSession,
      importRepositorySource,
      importLibraryBaseAsset,
      startLibraryMonitoring,
      startSourceMonitoring,
      reportMonitorLaunchFailure,
      resumeAudio,
      replaySession,
    });

    actions.onSectionChange("setup");
    actions.onInspect();
    actions.onStopMonitoring();
    expect(await actions.onImportRepository({ sourcePath: "/tmp/repo" } as never)).toBe(true);
    expect(await actions.onImportBaseAsset({ sourcePath: "/tmp/asset" } as never)).toBe(false);
    await actions.onStartLibraryMonitoring("repo-1");
    await actions.onStartMonitoring({ id: "repo-1", title: "repo", origin: "repository" });
    await actions.onReplaySession("session-1", "/tmp/log", "repo");
    actions.onInspectFloatingWaveform();

    expect(setCurrentSection).toHaveBeenNthCalledWith(1, "setup");
    expect(setCurrentSection).toHaveBeenNthCalledWith(2, "inspect");
    expect(setCurrentSection).toHaveBeenNthCalledWith(3, "monitor");
    expect(stopSession).toHaveBeenCalledTimes(1);
    expect(reportMonitorLaunchFailure).toHaveBeenCalledWith("library", {
      ok: false,
      reason: "start-failed",
    });
    expect(reportMonitorLaunchFailure).toHaveBeenCalledTimes(1);
    expect(resumeAudio).not.toHaveBeenCalled();
    expect(replaySession).toHaveBeenCalledWith("session-1", "/tmp/log", "repo");
  });

  it("builds shell and section content props without inline app composition", () => {
    const shellProps = buildAppV0ShellProps({
      currentSection: "monitor",
      isMonitoring: true,
      monitoringStatus: { source: "visits-service", anomalies: 4, uptime: "14s" },
      selectedItem: "visits-service",
      trackCount: 8,
      repositoryCount: 5,
      baseAssetCount: 2,
      onSectionChange: vi.fn(),
      onInspect: vi.fn(),
      onStopMonitoring: vi.fn(),
      isCollapsed: false,
      onToggleCollapse: vi.fn(),
    });

    expect(shellProps.currentSection).toBe("monitor");
    expect(shellProps.isMonitoring).toBe(true);
    expect(shellProps.monitoringStatus?.anomalies).toBe(4);

    const sectionInput = buildAppV0SectionContentInput({
      currentSection: "setup",
      userMode: "simple",
      fallbackViewModel: buildAppV0FallbackViewModel(en),
      setupPreferences: {
        defaultCloudLookback: "10m",
        idleHoldMs: 900,
        tailWindowRows: 1200,
      },
      lang: "en",
      skin: "nightfall",
      onChangeLanguage: vi.fn(),
      onChangeSkin: vi.fn(),
      onUpdateSetupPreference: vi.fn(),
      monitorSession: null,
      monitorMetrics: { windowCount: 0, processedLines: 0, totalAnomalies: 0 },
      pastSessions: [],
      repositories: [],
      tracks: [track],
      baseAssets: [],
      selectedRepositoryId: null,
      onSelectRepository: vi.fn(),
      onImportRepository: vi.fn(async () => true),
      onImportBaseAsset: vi.fn(async () => false),
      selectedTrackId: "track-1",
      onSelectTrack: vi.fn(),
      onStartLibraryMonitoring: vi.fn(async () => undefined),
      onStopMonitor: vi.fn(),
      onResumeAudio: vi.fn(async () => undefined),
      audioStatus: "closed",
      audioContext: null,
      monitorTrackName: "around-the-world.mp3",
      waveformBins: [0.2, 0.4, 0.6],
      onStartMonitoring: vi.fn(async () => undefined),
      onReplaySession: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      isConsoleExpanded: false,
      onToggleConsole: vi.fn(),
    });

    expect(sectionInput.currentSection).toBe("setup");
    expect(sectionInput.skin).toBe("nightfall");
    expect(sectionInput.waveformBins).toEqual([0.2, 0.4, 0.6]);
    expect(sectionInput.selectedTrackId).toBe("track-1");
  });

  it("builds the top-level app screen model from shell, content and floating waveform state", () => {
    const contentActions = buildAppV0ContentActions({
      setCurrentSection: vi.fn(),
      stopSession: vi.fn(async () => undefined),
      importRepositorySource: vi.fn(async () => ({ id: "repo-1" })),
      importLibraryBaseAsset: vi.fn(async () => ({ id: "asset-1" })),
      startLibraryMonitoring: vi.fn(async () => ({ ok: true as const })),
      startSourceMonitoring: vi.fn(async () => ({ ok: true as const })),
      reportMonitorLaunchFailure: vi.fn(),
      resumeAudio: vi.fn(async () => undefined),
      replaySession: vi.fn(async () => undefined),
    });

    const sectionInput = buildAppV0SectionContentInput({
      currentSection: "monitor",
      userMode: "simple",
      fallbackViewModel: buildAppV0FallbackViewModel(en),
      setupPreferences: {
        defaultCloudLookback: "10m",
        idleHoldMs: 900,
        tailWindowRows: 1200,
      },
      lang: "en",
      skin: "nightfall",
      onChangeLanguage: vi.fn(),
      onChangeSkin: vi.fn(),
      onUpdateSetupPreference: vi.fn(),
      monitorSession: null,
      monitorMetrics: { windowCount: 0, processedLines: 0, totalAnomalies: 0 },
      pastSessions: [],
      repositories: [],
      tracks: [track],
      baseAssets: [],
      selectedRepositoryId: null,
      onSelectRepository: vi.fn(),
      onImportRepository: vi.fn(async () => true),
      onImportBaseAsset: vi.fn(async () => false),
      selectedTrackId: "track-1",
      onSelectTrack: vi.fn(),
      onStartLibraryMonitoring: vi.fn(async () => undefined),
      onStopMonitor: vi.fn(async () => undefined),
      onResumeAudio: vi.fn(async () => undefined),
      audioStatus: "closed",
      audioContext: null,
      monitorTrackName: "around-the-world.mp3",
      waveformBins: [0.2, 0.4, 0.6],
      onStartMonitoring: vi.fn(async () => undefined),
      onReplaySession: vi.fn(async () => undefined),
      subscribe: vi.fn(() => vi.fn()),
      isConsoleExpanded: false,
      onToggleConsole: vi.fn(),
    });

    const screenModel = buildAppV0ScreenModel({
      shell: {
        currentSection: "monitor",
        isSidebarCollapsed: false,
        toggleSidebarCollapsed: vi.fn(),
        isConsoleExpanded: false,
        toggleConsoleExpanded: vi.fn(),
        openMonitorInspector: vi.fn(),
      },
      contentActions,
      shellViewModel: {
        monitoringStatus: {
          source: "visits-service",
          anomalies: 3,
          uptime: "15s",
        },
        selectedItem: "visits-service",
        floatingWaveformBar: {
          isVisible: true,
          source: "visits-service",
          anomalies: 3,
          uptime: "15s",
        },
      },
      currentSection: "monitor",
      isMonitoring: true,
      trackCount: 1,
      repositoryCount: 2,
      baseAssetCount: 0,
      sectionContentInput: sectionInput,
    });

    expect(screenModel.appShellProps.currentSection).toBe("monitor");
    expect(screenModel.appShellProps.onSectionChange).toBe(contentActions.onSectionChange);
    expect(screenModel.sectionContentInput).toBe(sectionInput);
    expect(screenModel.floatingWaveformBarProps).toMatchObject({
      isActive: true,
      source: "visits-service",
      anomalies: 3,
      uptime: "15s",
    });
  });
});
