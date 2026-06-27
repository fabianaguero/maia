import { describe, expect, it, vi } from "vitest";

import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../src/features/simple/monitorSetupPreferences";
import {
  buildAppV0FallbackPanelStyle,
  buildAppV0SectionRenderModel,
} from "../src/appV0SectionContentRuntime";

describe("appV0SectionContentRuntime", () => {
  it("builds a section render model for the simple monitor surface", () => {
    const onToggleConsole = vi.fn();
    const model = buildAppV0SectionRenderModel({
      currentSection: "monitor",
      userMode: "simple",
      fallbackViewModel: { message: "Nothing here", hint: "Select another section" },
      setupPreferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
      lang: "es",
      skin: "nightfall",
      onChangeLanguage: vi.fn(),
      onChangeSkin: vi.fn(),
      onUpdateSetupPreference: vi.fn(),
      monitorSession: null,
      monitorMetrics: {
        windowCount: 1,
        processedLines: 8,
        totalAnomalies: 2,
      },
      pastSessions: [],
      repositories: [],
      tracks: [],
      baseAssets: [],
      selectedRepositoryId: null,
      onSelectRepository: vi.fn(),
      onImportRepository: vi.fn(async () => true),
      onImportBaseAsset: vi.fn(async () => true),
      selectedTrackId: null,
      onSelectTrack: vi.fn(),
      onStartLibraryMonitoring: vi.fn(async () => undefined),
      onStopMonitor: vi.fn(),
      onResumeAudio: vi.fn(async () => undefined),
      audioStatus: "running",
      audioContext: null,
      monitorTrackName: "Donna Summer",
      waveformBins: [0.2, 0.4],
      onStartMonitoring: vi.fn(),
      onReplaySession: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      isConsoleExpanded: true,
      onToggleConsole,
    });

    expect(model.kind).toBe("simple-monitor");
    expect(model.simpleMonitorProps.trackName).toBe("Donna Summer");
    expect(model.simpleMonitorProps.liveSettings).toBe(DEFAULT_MONITOR_SETUP_PREFERENCES);
    expect(model.simpleMonitorProps.isConsoleExpanded).toBe(true);
    expect(model.simpleMonitorProps.onToggleConsole).toBe(onToggleConsole);
  });

  it("builds section props for setup, connections and fallback views", () => {
    const model = buildAppV0SectionRenderModel({
      currentSection: "connections",
      userMode: "simple",
      fallbackViewModel: { message: "Nothing here", hint: "Select another section" },
      setupPreferences: {
        ...DEFAULT_MONITOR_SETUP_PREFERENCES,
        defaultCloudLookback: "120m",
      },
      lang: "en",
      skin: "daybreak",
      onChangeLanguage: vi.fn(),
      onChangeSkin: vi.fn(),
      onUpdateSetupPreference: vi.fn(),
      monitorSession: null,
      monitorMetrics: {
        windowCount: 0,
        processedLines: 0,
        totalAnomalies: 0,
      },
      pastSessions: [],
      repositories: [],
      tracks: [],
      baseAssets: [],
      selectedRepositoryId: null,
      onSelectRepository: vi.fn(),
      onImportRepository: vi.fn(async () => true),
      onImportBaseAsset: vi.fn(async () => true),
      selectedTrackId: null,
      onSelectTrack: vi.fn(),
      onStartLibraryMonitoring: vi.fn(async () => undefined),
      onStopMonitor: vi.fn(),
      onResumeAudio: vi.fn(async () => undefined),
      audioStatus: "closed",
      audioContext: null,
      onStartMonitoring: vi.fn(),
      onReplaySession: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      isConsoleExpanded: false,
    });

    expect(model.kind).toBe("connections");
    expect(model.connectionsProps.defaultCloudLookback).toBe("120m");
    expect(model.setupProps.lang).toBe("en");
    expect(model.setupProps.skin).toBe("daybreak");
    expect(model.fallbackViewModel.message).toBe("Nothing here");
  });

  it("builds stable fallback panel styles", () => {
    expect(buildAppV0FallbackPanelStyle()).toEqual({
      padding: "3rem",
      textAlign: "center",
      color: "#a8b3c1",
      fontSize: "14px",
    });
  });
});
