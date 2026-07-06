import { describe, expect, it, vi } from "vitest";

import {
  buildAppV0ScreenCounts,
  buildAppV0ScreenModelArgs,
  buildAppV0ScreenModelHookResult,
  buildAppV0ScreenShellState,
  buildAppV0ScreenState,
} from "../../src/hooks/appV0ScreenModelHookRuntime";

function createScreenModelInput() {
  return {
    currentSection: "monitor",
    isSidebarCollapsed: false,
    toggleSidebarCollapsed: vi.fn(),
    isConsoleExpanded: true,
    toggleConsoleExpanded: vi.fn(),
    openMonitorInspector: vi.fn(),
    shellViewModel: {
      monitoringStatus: {
        source: "visits-service",
        anomalies: 3,
        uptime: "14s",
        confidence: 87,
      },
      selectedItem: "visits-service",
      floatingWaveformBar: {
        isVisible: true,
        source: "visits-service",
        anomalies: 3,
        uptime: "14s",
      },
    },
    isMonitoring: true,
    library: {
      tracks: [{ id: "track-1" }, { id: "track-2" }],
    },
    repositories: {
      repositories: [{ id: "repo-1" }],
    },
    baseAssets: {
      baseAssets: [{ id: "base-1" }, { id: "base-2" }],
    },
  } as never;
}

describe("appV0ScreenModelHookRuntime", () => {
  it("builds the screen-model composition args from hook input and section state", () => {
    const input = createScreenModelInput();
    const shellState = buildAppV0ScreenShellState(input);
    const counts = buildAppV0ScreenCounts(input);
    const screenState = buildAppV0ScreenState(input);
    const state = {
      contentActions: {
        onSectionChange: vi.fn(),
        onStopMonitoring: vi.fn(),
        onInspectFloatingWaveform: vi.fn(),
      },
      sectionContentInput: {
        currentSection: "monitor",
      },
    } as never;

    const args = buildAppV0ScreenModelArgs(input, state);
    const result = buildAppV0ScreenModelHookResult({
      ...state,
      screenModel: {
        appShellProps: { currentSection: "monitor" },
        sectionContentInput: state.sectionContentInput,
        floatingWaveformBarProps: null,
      },
    });

    expect(shellState.currentSection).toBe("monitor");
    expect(counts.trackCount).toBe(2);
    expect(screenState.isMonitoring).toBe(true);
    expect(args.shell.currentSection).toBe("monitor");
    expect(args.shell.toggleConsoleExpanded).toBe(input.toggleConsoleExpanded);
    expect(args.trackCount).toBe(2);
    expect(args.repositoryCount).toBe(1);
    expect(args.baseAssetCount).toBe(2);
    expect(args.sectionContentInput).toBe(state.sectionContentInput);
    expect(result.contentActions).toBe(state.contentActions);
    expect(result.screenModel.sectionContentInput).toBe(state.sectionContentInput);
  });
});
