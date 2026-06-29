import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LiveTailPanel } from "../../src/features/simple/LiveTailPanel";
import type { MonitorLogLine } from "../../src/features/simple/monitorLogParsing";
import { formatAnomalyCueCode } from "../../src/features/simple/monitorDisplay";
import { I18nContext } from "../../src/i18n/I18nContext";
import { en } from "../../src/i18n/en";

afterEach(() => {
  cleanup();
});

function createLine(overrides: Partial<MonitorLogLine> = {}): MonitorLogLine {
  return {
    id: "line-1",
    timestamp: "10:21:02",
    level: "info",
    message: "Polling monitor window",
    isAnomaly: false,
    anomalyId: null,
    ...overrides,
  };
}

function renderPanel(overrides: Partial<React.ComponentProps<typeof LiveTailPanel>> = {}) {
  const props: React.ComponentProps<typeof LiveTailPanel> = {
    isConsoleExpanded: false,
    onToggleConsole: vi.fn(),
    isAnomalyFilterActive: false,
    onClearAnomalyFilter: vi.fn(),
    onRefresh: vi.fn(),
    onSimulateLog: vi.fn(),
    terminalLinesRef: React.createRef<HTMLDivElement>(),
    onTerminalScroll: vi.fn(),
    liveLines: [],
    isConnectingMonitor: false,
    monitorSourcePath: "/logs/visits-service.log",
    streamAdapterLabel: "File tail",
    selectedAnomalyId: null,
    onSelectAnomalyLine: vi.fn(),
    registerLineRef: vi.fn(),
    ...overrides,
  };

  const view = render(
    <I18nContext.Provider value={en}>
      <LiveTailPanel {...props} />
    </I18nContext.Provider>,
  );

  return { ...view, props };
}

describe("LiveTailPanel", () => {
  it("renders connecting empty state with monitor source hint", () => {
    renderPanel({
      isConnectingMonitor: true,
    });

    expect(screen.getByText(en.simpleMode.monitor.connectingRemoteStream)).toBeInTheDocument();
    expect(
      screen.getByText(`${en.simpleMode.monitor.openingSourceWaiting}: /logs/visits-service.log`),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        en.simpleMode.monitor.sourceStatusConnecting.replace("{adapter}", "File tail"),
      ).length,
    ).toBeGreaterThan(1);
  });

  it("routes header actions without collapsing the panel from control clicks", () => {
    const onToggleConsole = vi.fn();
    const onRefresh = vi.fn();
    const onSimulateLog = vi.fn();
    const onClearAnomalyFilter = vi.fn();

    renderPanel({
      onToggleConsole,
      onRefresh,
      onSimulateLog,
      onClearAnomalyFilter,
      isAnomalyFilterActive: true,
      liveLines: [createLine({ level: "error", isAnomaly: true, anomalyId: "err-1" })],
    });

    fireEvent.click(screen.getByText(en.simpleMode.common.refresh));
    fireEvent.click(screen.getByText(en.simpleMode.common.simulateData));
    fireEvent.click(screen.getByText(en.simpleMode.common.showAll));

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onSimulateLog).toHaveBeenCalledTimes(1);
    expect(onClearAnomalyFilter).toHaveBeenCalledTimes(1);
    expect(onToggleConsole).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(en.simpleMode.monitor.anomalyDetectionStream));
    expect(onToggleConsole).toHaveBeenCalledTimes(1);
  });

  it("renders anomaly rows, linked states and selection callbacks", () => {
    const onSelectAnomalyLine = vi.fn();
    const registerLineRef = vi.fn();
    const anomalyId = "2026-06-28-500-checkout";
    const anomalyCode = formatAnomalyCueCode(anomalyId);

    const { container } = renderPanel({
      liveLines: [
        createLine(),
        createLine({
          id: "line-2",
          timestamp: "10:21:03",
          level: "error",
          message: "500 on POST /checkout",
          isAnomaly: true,
          anomalyId,
        }),
      ],
      selectedAnomalyId: anomalyId,
      onSelectAnomalyLine,
      registerLineRef,
    });

    expect(
      screen.getAllByText(
        en.simpleMode.monitor.sourceStatusLive
          .replace("{adapter}", "File tail")
          .replace("{count}", "2"),
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(en.simpleMode.monitor.levelInfoShort).length).toBeGreaterThan(0);
    expect(screen.getAllByText(en.simpleMode.monitor.levelErrorShort).length).toBeGreaterThan(0);
    expect(screen.getByText(anomalyCode)).toBeInTheDocument();
    expect(screen.getByTitle(`${anomalyCode} · ${en.simpleMode.monitor.linked}`)).toBeInTheDocument();

    const anomalyLine = container.querySelector(".terminal-line.anomaly-line.linked-anomaly");
    expect(anomalyLine).not.toBeNull();

    fireEvent.click(screen.getByText("500 on POST /checkout"));

    expect(onSelectAnomalyLine).toHaveBeenCalledWith(anomalyId);
    expect(registerLineRef).toHaveBeenCalledTimes(2);
  });
});
