import { describe, expect, it, vi } from "vitest";

import {
  beginWaveformAnchorDragState,
  beginWaveformCueDragState,
  beginWaveformLoopBoundaryDragState,
  beginWaveformLoopDragState,
  consumeWaveformDraggedClick,
  toggleWaveformGridClickArmedState,
  toggleWaveformPhraseSelectArmedState,
} from "../../../../src/features/analyzer/components/waveformPlaceholderInteractionActionRuntime";

describe("waveformPlaceholderInteractionActionRuntime", () => {
  it("starts cue dragging and seeds refs plus drag target state", () => {
    const dragMovedRef = { current: true };
    const dragStartClientXRef = { current: null as number | null };
    const dragEditSecondRef = { current: null as number | null };
    const setGridClickArmed = vi.fn();
    const setPhraseSelectArmed = vi.fn();
    const setDragEditSecond = vi.fn();
    const setDragTarget = vi.fn();

    beginWaveformCueDragState({
      clientX: 44,
      cue: {
        id: "cue-1",
        second: 12,
        label: "Drop",
        kind: "hot",
      },
      second: 12,
      dragMovedRef,
      dragStartClientXRef,
      dragEditSecondRef,
      setGridClickArmed,
      setPhraseSelectArmed,
      setDragEditSecond,
      setDragTarget,
    });

    expect(dragMovedRef.current).toBe(false);
    expect(dragStartClientXRef.current).toBe(44);
    expect(dragEditSecondRef.current).toBe(12);
    expect(setGridClickArmed).toHaveBeenCalledWith(false);
    expect(setPhraseSelectArmed).toHaveBeenCalledWith(false);
    expect(setDragEditSecond).toHaveBeenCalledWith(12);
    expect(setDragTarget).toHaveBeenCalledWith({
      type: "cue",
      cue: {
        id: "cue-1",
        second: 12,
        label: "Drop",
        kind: "hot",
      },
    });
  });

  it("starts loop and loop-boundary drags using focused targets", () => {
    const shared = {
      dragMovedRef: { current: false },
      dragStartClientXRef: { current: null as number | null },
      dragEditSecondRef: { current: null as number | null },
      setGridClickArmed: vi.fn(),
      setPhraseSelectArmed: vi.fn(),
      setDragEditSecond: vi.fn(),
      setDragTarget: vi.fn(),
    };

    beginWaveformLoopDragState({
      clientX: 60,
      loopId: "loop-1",
      startSecond: 8,
      endSecond: 12,
      pointerOffsetSecond: 0.5,
      ...shared,
    });

    expect(shared.dragEditSecondRef.current).toBe(8);
    expect(shared.setDragTarget).toHaveBeenCalledWith({
      type: "loop",
      loopId: "loop-1",
      startSecond: 8,
      endSecond: 12,
      pointerOffsetSecond: 0.5,
    });

    beginWaveformLoopBoundaryDragState({
      clientX: 80,
      loopId: "loop-1",
      boundary: "end",
      second: 12,
      ...shared,
    });

    expect(shared.dragEditSecondRef.current).toBe(12);
    expect(shared.setDragTarget).toHaveBeenLastCalledWith({
      type: "loop-boundary",
      loopId: "loop-1",
      boundary: "end",
    });
  });

  it("consumes dragged clicks exactly once and toggles armed states", () => {
    const dragMovedRef = { current: true };

    expect(consumeWaveformDraggedClick({ dragMovedRef })).toBe(true);
    expect(dragMovedRef.current).toBe(false);
    expect(consumeWaveformDraggedClick({ dragMovedRef })).toBe(false);

    const setGridClickArmed = vi.fn();
    const setPhraseSelectArmed = vi.fn();
    toggleWaveformGridClickArmedState({
      setGridClickArmed,
      setPhraseSelectArmed,
    });
    toggleWaveformPhraseSelectArmedState({
      setGridClickArmed,
      setPhraseSelectArmed,
    });

    expect(setPhraseSelectArmed).toHaveBeenCalledWith(false);
    expect(setGridClickArmed).toHaveBeenCalledWith(expect.any(Function));
    expect(setGridClickArmed).toHaveBeenCalledWith(false);
    expect(setPhraseSelectArmed).toHaveBeenCalledWith(expect.any(Function));
  });

  it("starts anchor dragging while clearing direct grid click mode", () => {
    const dragAnchorSecondRef = { current: null as number | null };
    const setGridClickArmed = vi.fn();
    const setGridAnchorDragging = vi.fn();
    const setDragAnchorSecond = vi.fn();

    beginWaveformAnchorDragState({
      anchorSecond: 32,
      dragAnchorSecondRef,
      setGridClickArmed,
      setGridAnchorDragging,
      setDragAnchorSecond,
    });

    expect(dragAnchorSecondRef.current).toBe(32);
    expect(setGridClickArmed).toHaveBeenCalledWith(false);
    expect(setGridAnchorDragging).toHaveBeenCalledWith(true);
    expect(setDragAnchorSecond).toHaveBeenCalledWith(32);
  });
});
