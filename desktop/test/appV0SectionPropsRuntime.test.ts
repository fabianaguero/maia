import { describe, expect, it, vi } from "vitest";

import {
  buildAppV0ConnectionsSectionProps,
  buildAppV0ProLibrarySectionProps,
  buildAppV0SetupSectionProps,
  buildAppV0SimpleLibrarySectionProps,
  buildAppV0SimpleMonitorSectionProps,
} from "../src/appV0SectionPropsRuntime";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../src/features/simple/monitorSetupPreferences";

describe("appV0SectionPropsRuntime", () => {
  it("builds simple monitor props from section input slices", () => {
    const onToggleConsole = vi.fn();

    const props = buildAppV0SimpleMonitorSectionProps({
      skin: "nightfall",
      monitorSession: null,
      monitorMetrics: {
        windowCount: 1,
        processedLines: 8,
        totalAnomalies: 2,
      },
      pastSessions: [],
      repositories: [],
      tracks: [],
      onStopMonitor: vi.fn(),
      onResumeAudio: vi.fn(async () => undefined),
      audioStatus: "running",
      audioContext: null,
      monitorTrackName: "Donna Summer",
      waveformBins: [0.2, 0.4],
      onStartMonitoring: vi.fn(),
      onReplaySession: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
      setupPreferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
      isConsoleExpanded: true,
      onToggleConsole,
    });

    expect(props.skin).toBe("nightfall");
    expect(props.trackName).toBe("Donna Summer");
    expect(props.liveSettings).toBe(DEFAULT_MONITOR_SETUP_PREFERENCES);
    expect(props.isConsoleExpanded).toBe(true);
    expect(props.onToggleConsole).toBe(onToggleConsole);
  });

  it("builds library, setup, pro-library and connections props", () => {
    const onImportRepository = vi.fn(async () => true);
    const onImportBaseAsset = vi.fn(async () => true);
    const onSelectRepository = vi.fn();
    const onSelectTrack = vi.fn();
    const onStartLibraryMonitoring = vi.fn(async () => undefined);
    const onChangeLanguage = vi.fn();
    const onChangeSkin = vi.fn();
    const onUpdateSetupPreference = vi.fn();

    const simpleLibraryProps = buildAppV0SimpleLibrarySectionProps({
      tracks: [],
      repositories: [],
      baseAssets: [],
      selectedRepositoryId: "repo-1",
      onSelectRepository,
      onImportRepository,
      onImportBaseAsset,
      selectedTrackId: "track-1",
      onSelectTrack,
      onStartLibraryMonitoring,
    });
    const proLibraryProps = buildAppV0ProLibrarySectionProps({
      tracks: [],
      repositories: [],
      baseAssets: [],
    });
    const connectionsProps = buildAppV0ConnectionsSectionProps({
      setupPreferences: {
        ...DEFAULT_MONITOR_SETUP_PREFERENCES,
        defaultCloudLookback: "120m",
      },
    });
    const setupProps = buildAppV0SetupSectionProps({
      lang: "en",
      onChangeLanguage,
      skin: "daybreak",
      onChangeSkin,
      setupPreferences: DEFAULT_MONITOR_SETUP_PREFERENCES,
      onUpdateSetupPreference,
    });

    expect(simpleLibraryProps.selectedRepositoryId).toBe("repo-1");
    expect(simpleLibraryProps.selectedTrackId).toBe("track-1");
    expect(simpleLibraryProps.onImportRepository).toBe(onImportRepository);
    expect(proLibraryProps.repositories).toEqual([]);
    expect(connectionsProps.defaultCloudLookback).toBe("120m");
    expect(setupProps.lang).toBe("en");
    expect(setupProps.skin).toBe("daybreak");
  });
});
