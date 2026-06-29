import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppV0SectionContent } from "../src/AppV0SectionContent";
import { DEFAULT_MONITOR_SETUP_PREFERENCES } from "../src/features/simple/monitorSetupPreferences";

vi.mock("../src/features/simple/SimpleMonitorScreen", () => ({
  SimpleMonitorScreen: (props: {
    trackName?: string;
    isConsoleExpanded: boolean;
    skin?: string;
  }) => (
    <div data-testid="simple-monitor">
      simple-monitor::{props.trackName ?? "none"}::{String(props.isConsoleExpanded)}::
      {props.skin ?? "no-skin"}
    </div>
  ),
}));

vi.mock("../src/features/simple/ProMonitorScreen", () => ({
  ProMonitorScreen: () => <div data-testid="pro-monitor">pro-monitor</div>,
}));

vi.mock("../src/features/simple/SimpleModeLibraryView", () => ({
  SimpleModeLibraryView: () => <div data-testid="simple-library">simple-library</div>,
}));

vi.mock("../src/features/simple/ProLibraryScreen", () => ({
  ProLibraryScreen: () => <div data-testid="pro-library">pro-library</div>,
}));

vi.mock("../src/features/simple/ConnectionsScreen", () => ({
  ConnectionsScreen: (props: { defaultCloudLookback?: string }) => (
    <div data-testid="connections">connections::{props.defaultCloudLookback ?? "unset"}</div>
  ),
}));

vi.mock("../src/features/simple/MonitorSetupScreen", () => ({
  MonitorSetupScreen: (props: { lang: string; skin: string }) => (
    <div data-testid="setup">
      setup::{props.lang}::{props.skin}
    </div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderSection(overrides: Partial<React.ComponentProps<typeof AppV0SectionContent>> = {}) {
  return render(
    <AppV0SectionContent
      currentSection="monitor"
      userMode="simple"
      fallbackViewModel={{
        message: "Nothing here",
        hint: "Select another section",
      }}
      setupPreferences={DEFAULT_MONITOR_SETUP_PREFERENCES}
      lang="es"
      skin="nightfall"
      onChangeLanguage={vi.fn()}
      onChangeSkin={vi.fn()}
      onUpdateSetupPreference={vi.fn()}
      monitorSession={null}
      monitorMetrics={{
        windowCount: 0,
        processedLines: 0,
        totalAnomalies: 0,
      }}
      pastSessions={[]}
      repositories={[]}
      tracks={[]}
      baseAssets={[]}
      selectedRepositoryId={null}
      onSelectRepository={vi.fn()}
      onImportRepository={vi.fn(async () => true)}
      onImportBaseAsset={vi.fn(async () => true)}
      selectedTrackId={null}
      onSelectTrack={vi.fn()}
      onStartLibraryMonitoring={vi.fn(async () => undefined)}
      onStopMonitor={vi.fn()}
      onResumeAudio={vi.fn(async () => undefined)}
      audioStatus="running"
      audioContext={null}
      monitorTrackName="Donna Summer"
      waveformBins={[0.2, 0.4]}
      onStartMonitoring={vi.fn()}
      onReplaySession={vi.fn()}
      subscribe={vi.fn(() => vi.fn())}
      isConsoleExpanded={false}
      onToggleConsole={vi.fn()}
      {...overrides}
    />,
  );
}

describe("AppV0SectionContent", () => {
  it("renders the simple monitor surface for simple monitor mode", () => {
    renderSection({
      currentSection: "monitor",
      userMode: "simple",
      isConsoleExpanded: true,
      skin: "copper",
    });

    expect(screen.getByTestId("simple-monitor")).toHaveTextContent(
      "simple-monitor::Donna Summer::true::copper",
    );
  });

  it("renders the pro library surface for expert library mode", () => {
    renderSection({
      currentSection: "library",
      userMode: "expert",
    });

    expect(screen.getByTestId("pro-library")).toHaveTextContent("pro-library");
  });

  it("passes setup preferences into the connections surface", () => {
    renderSection({
      currentSection: "connections",
      setupPreferences: {
        ...DEFAULT_MONITOR_SETUP_PREFERENCES,
        defaultCloudLookback: "120m",
      },
    });

    expect(screen.getByTestId("connections")).toHaveTextContent("connections::120m");
  });

  it("renders the setup surface with the active language and skin", () => {
    renderSection({
      currentSection: "setup",
      lang: "en",
      skin: "daybreak",
    });

    expect(screen.getByTestId("setup")).toHaveTextContent("setup::en::daybreak");
  });

  it("falls back to the placeholder copy for unsupported sections", () => {
    renderSection({
      currentSection: "compose",
    });

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Select another section")).toBeInTheDocument();
  });
});
