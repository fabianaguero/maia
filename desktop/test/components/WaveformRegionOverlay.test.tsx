import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WaveformRegionOverlay } from "../../src/features/analyzer/components/WaveformRegionOverlay";

describe("WaveformRegionOverlay", () => {
  afterEach(() => {
    cleanup();
  });

  it("seeks regions, suppresses residual clicks after drag, and seeks selected phrases", () => {
    const onSeek = vi.fn();
    const dragMovedRef = { current: false };

    render(
      <WaveformRegionOverlay
        renderedRegions={[
          {
            id: "loop-1",
            startSecond: 8,
            endSecond: 12,
            label: "Loop A",
            type: "loop",
            color: null,
            excerpt: "Main loop",
            editableLoop: false,
          },
        ]}
        selectedPhraseRange={{
          startSecond: 16,
          endSecond: 24,
          startBeatIndex: 32,
          endBeatIndex: 48,
          beatCount: 16,
          label: "Phrase 2",
        }}
        durationSeconds={40}
        canEditPerformance={false}
        beatGrid={[{ index: 0, second: 0 }]}
        onSeek={onSeek}
        onBeginLoopDrag={vi.fn()}
        onBeginLoopBoundaryDrag={vi.fn()}
        resolveSecondFromClientX={vi.fn(() => null)}
        dragMovedRef={dragMovedRef}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Seek to Loop A" }));
    expect(onSeek).toHaveBeenCalledWith(8);

    dragMovedRef.current = true;
    fireEvent.click(screen.getByRole("button", { name: "Seek to Loop A" }));
    expect(onSeek).toHaveBeenCalledTimes(1);
    expect(dragMovedRef.current).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Seek to Phrase 2" }));
    expect(onSeek).toHaveBeenCalledWith(16);
  });

  it("supports keyboard and pointer loop edits from the region body and boundaries", () => {
    const onSeek = vi.fn();
    const onMoveLoop = vi.fn();
    const onMoveLoopBoundary = vi.fn();
    const onBeginLoopDrag = vi.fn();
    const onBeginLoopBoundaryDrag = vi.fn();
    const resolveSecondFromClientX = vi.fn(() => 9);

    render(
      <WaveformRegionOverlay
        renderedRegions={[
          {
            id: "loop-1",
            startSecond: 8,
            endSecond: 12,
            label: "Loop A",
            type: "loop",
            color: "#00d1ff",
            excerpt: null,
            editableLoop: true,
          },
        ]}
        selectedPhraseRange={null}
        durationSeconds={40}
        canEditPerformance={true}
        beatGrid={Array.from({ length: 65 }, (_, index) => ({
          index,
          second: index * 0.5,
        }))}
        onSeek={onSeek}
        onMoveLoop={onMoveLoop}
        onMoveLoopBoundary={onMoveLoopBoundary}
        onBeginLoopDrag={onBeginLoopDrag}
        onBeginLoopBoundaryDrag={onBeginLoopBoundaryDrag}
        resolveSecondFromClientX={resolveSecondFromClientX}
        dragMovedRef={{ current: false }}
      />,
    );

    const loopButton = screen.getByRole("button", { name: "Seek to Loop A" });
    const startHandle = screen.getByRole("button", { name: "Drag start of Loop A" });
    const endHandle = screen.getByRole("button", { name: "Drag end of Loop A" });

    fireEvent.keyDown(loopButton, { key: "ArrowRight" });
    expect(onMoveLoop).toHaveBeenCalledWith("loop-1", 8.5);

    fireEvent.keyDown(loopButton, { key: "Enter" });
    expect(onSeek).toHaveBeenCalledWith(8);

    fireEvent.mouseDown(loopButton, { clientX: 90 });
    expect(resolveSecondFromClientX).toHaveBeenCalledWith(90);
    expect(onBeginLoopDrag).toHaveBeenCalledWith({
      eventClientX: 90,
      loopId: "loop-1",
      startSecond: 8,
      endSecond: 12,
      pointerOffsetSecond: 1,
    });

    fireEvent.keyDown(startHandle, { key: "ArrowLeft" });
    expect(onMoveLoopBoundary).toHaveBeenCalledWith("loop-1", "start", 7.5);

    fireEvent.keyDown(endHandle, { key: "ArrowRight" });
    expect(onMoveLoopBoundary).toHaveBeenCalledWith("loop-1", "end", 12.5);

    fireEvent.mouseDown(startHandle, { clientX: 80 });
    expect(onBeginLoopBoundaryDrag).toHaveBeenCalledWith({
      eventClientX: 80,
      loopId: "loop-1",
      boundary: "start",
      second: 8,
    });

    fireEvent.mouseDown(endHandle, { clientX: 120 });
    expect(onBeginLoopBoundaryDrag).toHaveBeenCalledWith({
      eventClientX: 120,
      loopId: "loop-1",
      boundary: "end",
      second: 12,
    });
  });

  it("disables keyboard seek when no seek handler is available", () => {
    const onMoveLoop = vi.fn();

    render(
      <WaveformRegionOverlay
        renderedRegions={[
          {
            id: "loop-1",
            startSecond: 8,
            endSecond: 12,
            label: "Loop A",
            type: "loop",
            color: null,
            excerpt: null,
            editableLoop: false,
          },
        ]}
        selectedPhraseRange={null}
        durationSeconds={40}
        canEditPerformance={false}
        beatGrid={[{ index: 0, second: 0 }]}
        onMoveLoop={onMoveLoop}
        onBeginLoopDrag={vi.fn()}
        onBeginLoopBoundaryDrag={vi.fn()}
        resolveSecondFromClientX={vi.fn(() => null)}
        dragMovedRef={{ current: false }}
      />,
    );

    const loopButton = screen.getByRole("button", { name: "Seek to Loop A" });
    expect(loopButton).toHaveAttribute("tabIndex", "-1");

    fireEvent.keyDown(loopButton, { key: "Enter" });
    expect(onMoveLoop).not.toHaveBeenCalled();
  });
});
