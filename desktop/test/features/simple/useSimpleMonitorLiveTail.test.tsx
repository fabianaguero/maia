import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSimpleMonitorLiveTail } from "../../../src/features/simple/useSimpleMonitorLiveTail";
import type { MonitorLogLine } from "../../../src/features/simple/monitorLogParsing";

function createLine(overrides: Partial<MonitorLogLine> = {}): MonitorLogLine {
  return {
    id: "line-1",
    timestamp: "10:00:00",
    level: "info",
    message: "boot",
    isAnomaly: false,
    anomalyId: null,
    ...overrides,
  };
}

describe("useSimpleMonitorLiveTail", () => {
  it("pins the tail to the bottom while the console is near the end", () => {
    const onSelectAnomalyId = vi.fn();
    const container = {
      scrollHeight: 900,
      scrollTop: 690,
      clientHeight: 200,
      scrollTo: vi.fn(),
    } as unknown as HTMLDivElement;

    const { result, rerender } = renderHook(
      ({ liveLines, selectedAnomalyId }) =>
        useSimpleMonitorLiveTail({
          liveLines,
          selectedAnomalyId,
          onSelectAnomalyId,
        }),
      {
        initialProps: {
          liveLines: [createLine()],
          selectedAnomalyId: null as string | null,
        },
      },
    );

    result.current.terminalLinesRef.current = container;

    rerender({
      liveLines: [createLine(), createLine({ id: "line-2", message: "next" })],
      selectedAnomalyId: null,
    });

    expect(container.scrollTo).toHaveBeenCalledWith({ top: 900, behavior: "auto" });
  });

  it("focuses the selected anomaly line after explicit anomaly selection", () => {
    const onSelectAnomalyId = vi.fn();
    const container = {
      scrollHeight: 900,
      scrollTop: 690,
      clientHeight: 200,
      scrollTo: vi.fn(),
    } as unknown as HTMLDivElement;
    const lineNode = {
      scrollIntoView: vi.fn(),
    } as unknown as HTMLDivElement;

    const { result, rerender } = renderHook(
      ({ liveLines, selectedAnomalyId }) =>
        useSimpleMonitorLiveTail({
          liveLines,
          selectedAnomalyId,
          onSelectAnomalyId,
        }),
      {
        initialProps: {
          liveLines: [createLine()],
          selectedAnomalyId: null as string | null,
        },
      },
    );

    act(() => {
      result.current.terminalLinesRef.current = container;
      result.current.registerLineRef("line-anomaly", lineNode);
      result.current.focusAnomaly("anomaly-1");
    });

    expect(onSelectAnomalyId).toHaveBeenCalledWith("anomaly-1");

    rerender({
      liveLines: [
        createLine({
          id: "line-anomaly",
          level: "warn",
          message: "timeout",
          isAnomaly: true,
          anomalyId: "anomaly-1",
        }),
      ],
      selectedAnomalyId: "anomaly-1",
    });

    expect(lineNode.scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      behavior: "smooth",
    });
  });
});
