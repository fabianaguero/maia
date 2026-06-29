import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TrackSavedLoopList } from "../../src/features/analyzer/components/TrackSavedLoopList";
import type { TrackSavedLoop } from "../../src/types/library";

const loops: TrackSavedLoop[] = [
  {
    id: "loop-1",
    slot: 1,
    startSecond: 64,
    endSecond: 72,
    label: "Loop A",
    color: null,
    locked: false,
  },
];

describe("TrackSavedLoopList", () => {
  it("renders loop rows and delegates loop actions", () => {
    const onSetBoundary = vi.fn();
    const onPatchLoop = vi.fn();
    const onRemoveLoop = vi.fn();

    render(
      <TrackSavedLoopList
        loops={loops}
        canEditPerformance
        sectionLabel="Saved loops"
        emptyLabel="No loops"
        labelText="Label"
        colorText="Color"
        slotTemplate="Slot {slot}"
        loopWord="Loop"
        lockedLabel="Locked"
        editableLabel="Editable"
        setStartText="Set start"
        setEndText="Set end"
        unlockLoopText="Unlock loop"
        lockLoopText="Lock loop"
        removeText={(name) => `Remove ${name}`}
        onSetBoundary={onSetBoundary}
        onPatchLoop={onPatchLoop}
        onRemoveLoop={onRemoveLoop}
        renderLoopLabel={(loop) => loop.label}
        colorOptions={[
          { value: "", label: "None" },
          { value: "#22d3ee", label: "Cyan" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Set start loop-1" }));
    fireEvent.click(screen.getByRole("button", { name: "Set end loop-1" }));
    fireEvent.blur(screen.getByLabelText("Label loop-1"), {
      target: { value: "Loop B" },
    });
    fireEvent.change(screen.getByLabelText("Color loop-1"), {
      target: { value: "#22d3ee" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lock loop loop-1" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Loop A" }));

    expect(onSetBoundary).toHaveBeenNthCalledWith(1, "loop-1", "start");
    expect(onSetBoundary).toHaveBeenNthCalledWith(2, "loop-1", "end");
    expect(onPatchLoop).toHaveBeenCalledWith("loop-1", { label: "Loop B" });
    expect(onPatchLoop).toHaveBeenCalledWith("loop-1", { color: "#22d3ee" });
    expect(onPatchLoop).toHaveBeenCalledWith("loop-1", { locked: true });
    expect(onRemoveLoop).toHaveBeenCalledWith("loop-1");
  });
});
