import type React from "react";
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
    vi.useFakeTimers();
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

    act(() => {
      rerender({
        liveLines: [createLine(), createLine({ id: "line-2", message: "next" })],
        selectedAnomalyId: null,
      });
      vi.runAllTimers();
    });

    expect(container.scrollTo).toHaveBeenCalledWith({ top: 900, behavior: "smooth" });
    vi.useRealTimers();
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

  it("does not auto-pin once the user scrolls away from the bottom", () => {
    const onSelectAnomalyId = vi.fn();
    const container = {
      scrollHeight: 900,
      scrollTop: 400,
      clientHeight: 200,
      scrollTo: vi.fn(),
    } as unknown as HTMLDivElement;

    const { result, rerender } = renderHook(
      ({ liveLines }) =>
        useSimpleMonitorLiveTail({
          liveLines,
          selectedAnomalyId: null,
          onSelectAnomalyId,
        }),
      {
        initialProps: {
          liveLines: [createLine()],
        },
      },
    );

    act(() => {
      result.current.terminalLinesRef.current = container;
      result.current.onTerminalScroll({
        currentTarget: container,
      } as React.UIEvent<HTMLDivElement>);
    });

    rerender({
      liveLines: [createLine(), createLine({ id: "line-2", message: "later" })],
    });

    expect(container.scrollTo).not.toHaveBeenCalled();
  });

  it("keeps waiting for focus when the anomaly line has not been registered yet", () => {
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

    act(() => {
      result.current.terminalLinesRef.current = container;
      result.current.focusAnomaly("anomaly-missing");
    });

    rerender({
      liveLines: [
        createLine({
          id: "line-missing",
          level: "warn",
          message: "timeout",
          isAnomaly: true,
          anomalyId: "anomaly-missing",
        }),
      ],
      selectedAnomalyId: "anomaly-missing",
    });

    expect(container.scrollTo).not.toHaveBeenCalled();

    const lateNode = {
      scrollIntoView: vi.fn(),
    } as unknown as HTMLDivElement;

    act(() => {
      result.current.registerLineRef("line-missing", lateNode);
    });

    rerender({
      liveLines: [
        createLine({
          id: "line-missing",
          level: "warn",
          message: "timeout",
          isAnomaly: true,
          anomalyId: "anomaly-missing",
        }),
      ],
      selectedAnomalyId: "anomaly-missing",
    });

    expect(lateNode.scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      behavior: "smooth",
    });
  });
});
