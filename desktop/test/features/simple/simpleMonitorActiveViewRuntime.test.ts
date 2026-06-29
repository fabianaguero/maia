import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { en } from "../../../src/i18n/en";
import { buildSimpleMonitorActiveViewSections } from "../../../src/features/simple/simpleMonitorActiveViewRuntime";
import type { SimpleMonitorActiveViewProps } from "../../../src/features/simple/SimpleMonitorActiveView";

function createProps(): SimpleMonitorActiveViewProps {
  return {
    isConnectingMonitor: false,
    monitorSourceTitle: "visits-service",
    monitorSourcePath: "/logs/visits-service.log",
    isAnomalyFilterActive: true,
    onToggleAnomalyFilter: vi.fn(),
    onClearAnomalyFilter: vi.fn(),
    totalAnomalies: 4,
    uptimeLabel: "15s",
    onStop: vi.fn(),
    isConsoleExpanded: true,
    onToggleConsole: vi.fn(),
    onRefresh: vi.fn(),
    onSimulateLog: vi.fn(),
    terminalLinesRef: createRef(),
    onTerminalScroll: vi.fn(),
    liveLines: [],
    streamAdapterLabel: "FILE_TAIL",
    selectedAnomalyId: "anomaly-1",
    onSelectAnomalyLine: vi.fn(),
    registerLineRef: vi.fn(),
    monitorTrackTitle: "Deck Track",
    musicStyleLabel: "House",
    deckPresetLabel: "Balanced",
    deckBpm: 126,
    trackElapsedSeconds: 32,
    deckRemainingSeconds: 208,
    selectedDeckMarker: null,
    selectedBurstCount: 3,
    overviewCanvasRef: createRef(),
    waveformCanvasRef: createRef(),
    waveformStageRef: createRef(),
    anomalyBurstRegions: [],
    selectedBurstRegionId: null,
    overviewAnomalyMarkers: [],
    overviewWindowLeftPercent: 20,
    overviewWindowWidthPercent: 30,
    overviewPlayheadLeftPercent: 35,
    onOverviewPointerDown: vi.fn(),
    onOverviewClick: vi.fn(),
    onOverviewAnomalyClick: vi.fn(),
    onOverviewAnomalyPointerDown: vi.fn(),
    deckTimelineMarkers: [],
    deckBeatMarkers: [],
    onStagePointerDown: vi.fn(),
    onStageClick: vi.fn(),
    stageHeightPx: 190,
    audioStatus: "running",
    onResumeAudio: vi.fn(),
  };
}

describe("simpleMonitorActiveViewRuntime", () => {
  it("builds section props for the active monitor surface", () => {
    const props = createProps();
    const sections = buildSimpleMonitorActiveViewSections({ t: en, props });

    expect(sections.headerProps.monitorSourceTitle).toBe("visits-service");
    expect(sections.headerProps.metrics).toHaveLength(2);
    expect(sections.deckSectionProps.deckTrackLine).toContain("Deck Track");
    expect(sections.deckSectionProps.selectedAnomalyId).toBe("anomaly-1");
    expect(sections.liveTailProps.selectedAnomalyId).toBe("anomaly-1");
    expect(sections.footerProps.audioStatus).toBe("running");
    expect(sections.footerProps.audioActionLabel).toBeTruthy();
  });
});
